#include "esp32-hal-log.h"
#pragma once
#include "Persistence.h"
#include "ThermalProfile.h"
#include "esp32-hal.h"
#include "esp_random.h"
#include "log.h"
#include <ESPAsyncWebServer.h>
#include <WebAPI.h>
#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <esp_system.h>
#include <iterator>
#include <mbedtls/md.h>
#include <span>
#include <vector>

///"0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
const uint8_t shared_key[32] = {0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
                                0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
                                0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
                                0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20};

bool WebServerState::AddSession(NonceType &nonceBuffer,
                                const IPAddress ipAddress) {

  if (sessions.size() >= WEBAPI_MAX_SESSIONS) {
    return false;
  }

  esp_fill_random(nonceBuffer.data(), WEBAPI_NONCE_LEN);

  auto newSession = std::unique_ptr<Session>(new Session());
  newSession->ipAddress = ipAddress;
  memcpy(newSession->nonce.data(), nonceBuffer.data(), WEBAPI_NONCE_LEN);
  newSession->timeoutTick = millis() + WEBAPI_TIMEOUT;

  sessions.push_back(std::move(newSession));
  return true;
}

/**
  Claims and destroys any matching nonce
  @param nonceBuffer the buffer containing the random data
  @param ipAddress the client's IPaddress
  @returns if the IP & nonce match it returns true, if the nonce matches but the
  ip does not the nonce is destroyed and returns false. if nothing matches
  returns false
*/
bool WebServerState::ClaimOrDestroy(const NonceType &nonceBuffer,
                                    const IPAddress ipAddress) {

  for (auto it = sessions.begin(); it != sessions.end(); it++) {
    if (memcmp((*it)->nonce.data(), nonceBuffer.data(), WEBAPI_NONCE_LEN) ==
        0) {
      bool matchesIp = ipAddress == (*it)->ipAddress;
      sessions.erase(it);
      return matchesIp;
    }
  }
  return false;
}

bool VerifySignature(std::span<uint8_t> payload) {
  if (payload.size() < sizeof(RequestHeaderSecure)) {
    log_e("payload smaller than request header size");
    return false;
  }

  auto *header = reinterpret_cast<RequestHeaderSecure *>(payload.data());
  SignatureType localSignature;
  auto incomingSignature = header->signature;

  std::fill(std::begin(header->signature), std::end(header->signature), 0);

  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  if (mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1) !=
      0) {
    mbedtls_md_free(&ctx);
    return false;
  }
  mbedtls_md_hmac_starts(&ctx, shared_key, sizeof(shared_key));
  mbedtls_md_hmac_update(&ctx, payload.data(), payload.size());
  mbedtls_md_hmac_finish(&ctx, localSignature.data());
  mbedtls_md_free(&ctx);
  return memcmp(localSignature.data(), incomingSignature.data(), 32) == 0;
}

WebServerState state = WebServerState();

auto mimeGuard = [](AsyncWebServerRequest *request) {
  if (request->header(HEADER_CONTENT_TYPE) != MIME_TYPE_APPLICATION_STREAM) {
    request->send(
        415, "text/plain; charset=utf-8",
        "Unsupported Content Type, Must be 'application/octet-stream'");
  }
};

bool ValidateSecureRequest(AsyncWebServerRequest *request,
                           WebServerState &state,
                           std::span<uint8_t> requestBuffer,
                           WebCommand expectedCommand) {

  const RequestHeaderSecure &requestHeader =
      *reinterpret_cast<const RequestHeaderSecure *>(requestBuffer.data());

  if (requestHeader.command != expectedCommand) {
    log_e("invalid Command");
    request->send(400, MIME_TYPE_TEXT, "Invalid command!");
    return false;
  }

  if (!VerifySignature(requestBuffer)) {
    request->send(401, MIME_TYPE_TEXT, "Unauthorized!");
    log_e("Invalid signature");
    return false;
  }

  if (!state.ClaimOrDestroy(requestHeader.nonce,
                            request->client()->remoteIP())) {
    request->send(401, MIME_TYPE_TEXT, "Unauthorized!");
    log_e("Invalid nonce");
    return false;
  }

  return true;
}

void SetupRoutes(AsyncWebServer &server) {

  Route__Get_Nonce(server, state);
  Route__Get_Root(server);

  Route__Post_Heartbeat(server, state);
  Route__Post_AllProfiles(server, state);
  Route__Put_Profile(server, state);

  // server.on("/api/start",HTTP_POST, [](AsyncWebServerRequest *request){
  //   request->send(200, "text/plain; charset=utf-8",FOX_ART);
  // });

  // server.on("/api/Stop",HTTP_POST, [](AsyncWebServerRequest *request){
  //   request->send(200, "text/plain; charset=utf-8",FOX_ART);
  // });

  // server.on("/api/log",HTTP_GET, [](AsyncWebServerRequest *request){
  //   request->send(200, "text/plain; charset=utf-8",FOX_ART);
  // });
};

void Route__Get_Root(AsyncWebServer &server) {
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/plain; charset=utf-8", "dfsdfs");
    log_i("GET ROOT");
  });
}

void Route__Post_AllProfiles(AsyncWebServer &server, WebServerState &state) {
  server.on("/api/profiles", HTTP_POST, mimeGuard, NULL,
            [&state](AsyncWebServerRequest *request, uint8_t *data, size_t len,
                     size_t index, size_t total) {
              if (index + len == total) {

                log_i("POST ALL PROFILES");
                std::span<uint8_t> requestBuffer(data, len);

                if (!ValidateSecureRequest(request, state, requestBuffer,
                                           WebCommand::profileAll)) {
                  return;
                }

                Persistence &persistence = Persistence::Store();
                auto &profiles = persistence.getProfileCollection();

                ResponseProfileAll responseHeader = {};
                responseHeader.deviceId = DEVICE_ID;
                responseHeader.time = millis();
                responseHeader.timeRollover = 0;
                responseHeader.response = (uint32_t)WebResponse::profileAll;
                responseHeader.payloadLength = sizeof(responseHeader);
                responseHeader.profileLen = profiles.size();

                if (profiles.size() == 0) {
                  responseHeader.payloadLength = sizeof(ResponseProfileAll);

                  AsyncResponseStream *response = request->beginResponseStream(
                      MIME_TYPE_APPLICATION_STREAM);
                  response->write((uint8_t *)&responseHeader,
                                  sizeof(ResponseProfileAll));
                  request->send(response);
                  return;
                }
                size_t collectionSize = 0;
                for (const auto &profile : profiles) {
                  collectionSize += profile.Size();
                }

                responseHeader.payloadLength =
                    sizeof(responseHeader) + collectionSize;
                std::vector<uint8_t> profilesBuffer(collectionSize);

                std::span<uint8_t> profilesView(profilesBuffer.data(),
                                                profilesBuffer.size());
                size_t currentOffset = 0;

                for (const auto &profile : profiles) {
                  std::span<uint8_t> currentPartition =
                      profilesView.subspan(currentOffset, profile.Size());
                  currentOffset += profile.Size();
                  if (!profile.Serialize(currentPartition)) {
                    log_e("Failed to serialize profile");
                    request->send(500, MIME_TYPE_TEXT, "profile error");
                  }
                }

                AsyncResponseStream *response =
                    request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
                response->write((uint8_t *)&responseHeader,
                                sizeof(ResponseProfileAll));
                response->write(profilesBuffer.data(), profilesBuffer.size());
                request->send(response);
              }
            });
}

void Route__Post_Heartbeat(AsyncWebServer &server, WebServerState &state) {
  server.on("/api/heartbeat", HTTP_POST, mimeGuard, NULL,
            [&state](AsyncWebServerRequest *request, uint8_t *data, size_t len,
                     size_t index, size_t total) {
              if (index + len == total) {
                log_i("POST HEARTBEAT");
                std::span<uint8_t> requestBuffer(data, len);

                if (!ValidateSecureRequest(request, state, requestBuffer,
                                           WebCommand::heartbeat)) {
                  return;
                }

                ResponseHeartbeat responseHeader = {};
                responseHeader.deviceId = DEVICE_ID;
                responseHeader.time = millis();
                responseHeader.timeRollover = 0;
                responseHeader.response = (uint32_t)WebResponse::profileAll;

                responseHeader.ok = true;
                AsyncResponseStream *response =
                    request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
                response->write((uint8_t *)&responseHeader,
                                sizeof(ResponseHeartbeat));
                request->send(response);
              }
            });
}

void Route__Get_Nonce(AsyncWebServer &server, WebServerState &state) {
  server.on("/api/nonce", HTTP_POST, [&state](AsyncWebServerRequest *request) {
    if (!request->client()) {
      request->send(500, MIME_TYPE_TEXT, "Internal Client Error");
      return;
    }

    NonceType nonce;

    if (!state.AddSession(nonce, request->client()->remoteIP())) {
      log_w("Could not create new sessions");
      request->send(503, MIME_TYPE_TEXT, "No sessions avaliable");
    }
    ResponseNonce payload = {};
    memcpy(payload.nonce.data(), nonce.data(), WEBAPI_NONCE_LEN);
    payload.deviceId = DEVICE_ID;
    payload.time = millis();
    payload.timeRollover = 0;
    payload.response = (uint32_t)WebResponse::nonce;
    payload.payloadLength = sizeof(payload);
    AsyncResponseStream *response =
        request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
    response->write((uint8_t *)&payload, sizeof(payload));
    request->send(response);
  });
}

void Route__Put_Profile(AsyncWebServer &server, WebServerState &state) {
  server.on(
      "/api/profile", HTTP_PUT, mimeGuard, NULL,
      [&state](AsyncWebServerRequest *request, uint8_t *data, size_t len,
               size_t index, size_t total) {
        if (index + len == total) {
          log_i("PUT PROFILE");
          std::span<uint8_t> requestBuffer(data, len);

          std::span<const uint8_t> blobspan(data + sizeof(RequestProfileUpload),
                                            len - sizeof(RequestProfileUpload));

          if (!ValidateSecureRequest(request, state, requestBuffer,
                                     WebCommand::profileUpload)) {
            return;
          }
          
          /* process*/
          ThermalProfile newProfile;
          if (!newProfile.Deserialize(blobspan)) {
            request->send(STATUS_BAD_CONTENT, MIME_TYPE_TEXT,
                          "Invalid Profile!");
            return;
          }
      

          Persistence &persistence = Persistence::Store();
          persistence.setThermalProfile(newProfile);
          persistence.Commit();

          /* Respond phase*/

          std::vector<uint8_t> profileBuffer(newProfile.Size());
          std::fill(profileBuffer.begin(), profileBuffer.end(), 0);
          std::span<uint8_t> outputSpan(profileBuffer.data(),
                                        profileBuffer.size());

          if (!newProfile.Serialize(outputSpan)) {
            request->send(STATUS_BAD_CONTENT, MIME_TYPE_TEXT,
                          "Invalid Profile!");
            return;
          }

          ResponseProfileUpload header = {};
          header.deviceId = DEVICE_ID;
          header.time = millis();
          header.timeRollover = 0;
          header.response = (uint32_t)WebResponse::profileUpload;
          header.payloadLength = sizeof(header) + newProfile.Size();
          header.ok = true;

          AsyncResponseStream *response =
              request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
          response->write((uint8_t *)&header, sizeof(ResponseProfileUpload));
          response->write(profileBuffer.data(), profileBuffer.size());
          request->send(response);
        }
      });
}

void Route__Delete_Profile(AsyncWebServer &server, WebServerState &state) {
  server.on("/api/profile", HTTP_DELETE, mimeGuard, NULL,
            [&state](AsyncWebServerRequest *request, uint8_t *data, size_t len,
                     size_t index, size_t total) {
              if (index + len == total) {
                std::span<uint8_t> requestBuffer(data, len);

                const RequestProfileDelete &requestHeader =
                    *reinterpret_cast<const RequestProfileDelete *>(
                        requestBuffer.data());

                if (!ValidateSecureRequest(request, state, requestBuffer,
                                           WebCommand::profileDelete)) {
                  return;
                }

                /* process*/

                Persistence &persistence = Persistence::Store();
                persistence.deleteThermalProfile(requestHeader.profileId);
                persistence.Commit();

                /* Respond phase*/

                ResponseProfileDelete header = {};
                header.deviceId = DEVICE_ID;
                header.time = millis();
                header.timeRollover = 0;
                header.response = (uint32_t)WebResponse::profileDelete;
                header.ok = true;

                AsyncResponseStream *response =
                    request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
                response->write((uint8_t *)&header,
                                sizeof(ResponseProfileUpload));
                request->send(response);
              }
            });
}

void Route__Post_Profile(AsyncWebServer &server, WebServerState &state) {
  server.on(
      "/api/profiles", HTTP_POST, mimeGuard, NULL,
      [&state](AsyncWebServerRequest *request, uint8_t *data, size_t len,
               size_t index, size_t total) {
        if (index + len == total) {

          log_i("POST ALL PROFILES");
          std::span<uint8_t> requestBuffer(data, len);

          const RequestProfile &requestHeader =
              *reinterpret_cast<const RequestProfile *>(requestBuffer.data());

          if (!ValidateSecureRequest(request, state, requestBuffer,
                                     WebCommand::profile)) {
            return;
          }

          Persistence &persistence = Persistence::Store();
          ThermalProfile foundProfile;

          ResponseProfile responseHeader = {};
          responseHeader.deviceId = DEVICE_ID;
          responseHeader.time = millis();
          responseHeader.timeRollover = 0;
          responseHeader.response = (uint32_t)WebResponse::profile;
          responseHeader.payloadLength = sizeof(responseHeader);

          if (!persistence.getThermalProfile(foundProfile,
                                             requestHeader.profileId)) {
            responseHeader.found = false;
            responseHeader.payloadLength = sizeof(ResponseProfile);

            AsyncResponseStream *response =
                request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
            response->write((uint8_t *)&responseHeader,
                            sizeof(ResponseProfile));
            request->send(response);
            return;
          }

          responseHeader.found = true;

          responseHeader.payloadLength =
              sizeof(responseHeader) + foundProfile.Size();
          std::vector<uint8_t> profilesBuffer(foundProfile.Size());

          std::span<uint8_t> profilesView(profilesBuffer.data(),
                                          profilesBuffer.size());

          if (!foundProfile.Serialize(profilesView)) {
            log_e("Failed to serialize profile");
            request->send(500, MIME_TYPE_TEXT, "profile error");
          }

          AsyncResponseStream *response =
              request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
          response->write((uint8_t *)&responseHeader, sizeof(ResponseProfile));
          response->write(profilesBuffer.data(), profilesBuffer.size());
          request->send(response);
        }
      });
}

void Route__Post_Manual(AsyncWebServer &server, WebServerState &state) {
  auto route = [&state](AsyncWebServerRequest *request, uint8_t *data,
                        size_t len, size_t index, size_t total) {
    if (index + len == total) {

      log_i("POST MANUAL");
      std::span<uint8_t> requestBuffer(data, len);

      const RequestManual &requestHeader =
          *reinterpret_cast<const RequestManual *>(requestBuffer.data());

      if (!ValidateSecureRequest(request, state, requestBuffer,
                                 WebCommand::manualOperation)) {
        return;
      }

      log_d("[NOT IMPLEMENTED] Modify operation manually here....");

      ResponseManual responseHeader = {};
      responseHeader.deviceId = DEVICE_ID;
      responseHeader.time = millis();
      responseHeader.timeRollover = 0;
      responseHeader.response = (uint32_t)WebResponse::manualOperation;
      responseHeader.payloadLength = sizeof(responseHeader);
      responseHeader.isHeating = false;     // TODO: get state
      responseHeader.targetTemperature = 0; // TODO: get state

      responseHeader.payloadLength = sizeof(responseHeader);

      AsyncResponseStream *response =
          request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
      response->write((uint8_t *)&responseHeader, sizeof(ResponseManual));
      request->send(response);
    }
  };
  server.on("/api/manual", HTTP_POST, mimeGuard, NULL, route);
}

void Route__Post_ProfileOperation(AsyncWebServer &server,
                                  WebServerState &state) {
  auto route = [&state](AsyncWebServerRequest *request, uint8_t *data,
                        size_t len, size_t index, size_t total) {
    if (index + len == total) {

      log_i("POST MANUAL");
      std::span<uint8_t> requestBuffer(data, len);

      const RequestProfileOperation &requestHeader =
          *reinterpret_cast<const RequestProfileOperation *>(
              requestBuffer.data());

      if (!ValidateSecureRequest(request, state, requestBuffer,
                                 WebCommand::manualOperation)) {
        return;
      }

      log_d("[NOT IMPLEMENTED] Modify operation manually here....");

      ResponseProfileOperation responseHeader = {};
      responseHeader.deviceId = DEVICE_ID;
      responseHeader.time = millis();
      responseHeader.timeRollover = 0;
      responseHeader.response = (uint32_t)WebResponse::manualOperation;
      responseHeader.payloadLength = sizeof(responseHeader);
      responseHeader.profileId = requestHeader.profileId; // TODO: get state
      responseHeader.status = OperationStatus::idle;      // TODO: get state

      responseHeader.payloadLength = sizeof(responseHeader);

      AsyncResponseStream *response =
          request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
      response->write((uint8_t *)&responseHeader, sizeof(ResponseManual));
      request->send(response);
    }
  };
  server.on("/api/profile/operation", HTTP_POST, mimeGuard, NULL, route);
}

void Route__Post_Log(AsyncWebServer &server, WebServerState &state) {
  auto route = [&state](AsyncWebServerRequest *request, uint8_t *data,
                        size_t len, size_t index, size_t total) {
    if (index + len == total) {

      log_i("POST LOG");
      std::span<uint8_t> requestBuffer(data, len);

      if (!ValidateSecureRequest(request, state, requestBuffer,
                                 WebCommand::log)) {
        return;
      }

      log_d("[NOT IMPLEMENTED] Modify operation manually here....");
      Logger &log = Logger::getLogger();
      ResponseLog responseHeader = {};
      responseHeader.deviceId = DEVICE_ID;
      responseHeader.time = millis();
      responseHeader.timeRollover = 0;
      responseHeader.response = (uint32_t)WebResponse::log;
      responseHeader.payloadLength = sizeof(responseHeader) + log.size();
      responseHeader.logLength = log.getTotalEntries();

      size_t *currentLogByteOffset = new size_t(0);

      AsyncWebServerResponse *response = request->beginChunkedResponse(
          MIME_TYPE_APPLICATION_STREAM,
          [responseHeader, currentLogByteOffset](uint8_t *buffer, size_t maxLen,
                                                 size_t index) -> size_t {
            Logger &log = Logger::getLogger();
            if (index == 0) {
              size_t headerSize = sizeof(ResponseLog);
              if (maxLen >= headerSize) {
                memcpy(buffer, &responseHeader, headerSize);
                return headerSize;
              }
              return 0;
            }

            size_t currentLogOffset = index - sizeof(ResponseLog);

            if (*currentLogByteOffset >= log.size()) {
              return 0;
            }

            int entryIndex = *currentLogByteOffset / sizeof(LogEntry);
            size_t insideStructOffset =
                *currentLogByteOffset % sizeof(LogEntry);

            LogEntry entry;
            if (!log.getEntryAt(entryIndex, entry)) {
              return 0;
            }
            size_t remainingLogBytes = log.size() - *currentLogByteOffset;
            size_t bytesToWrite =
                std::min({maxLen, remainingLogBytes,
                          sizeof(LogEntry) - insideStructOffset});
            uint8_t *sourcePtr = ((uint8_t *)&entry) + insideStructOffset;
            memcpy(buffer, sourcePtr, bytesToWrite);
            *currentLogByteOffset += bytesToWrite;
            return bytesToWrite;
          });
      request->send(response);
    }
  };
  server.on("/api/log", HTTP_POST, mimeGuard, NULL, route);
}

void Route__Post_Status(AsyncWebServer &server, WebServerState &state) {
  auto route = [&state](AsyncWebServerRequest *request, uint8_t *data,
                        size_t len, size_t index, size_t total) {
    if (index + len == total) {

      log_i("POST STATUS");
      std::span<uint8_t> requestBuffer(data, len);

      const RequestProfileOperation &requestHeader =
          *reinterpret_cast<const RequestProfileOperation *>(
              requestBuffer.data());

      if (!ValidateSecureRequest(request, state, requestBuffer,
                                 WebCommand::status)) {
        return;
      }

      log_d("[NOT IMPLEMENTED] Modify operation manually here....");

      ResponseStatus responseHeader = {};
      responseHeader.deviceId = DEVICE_ID;
      responseHeader.time = millis();
      responseHeader.timeRollover = 0;
      responseHeader.response = (uint32_t)WebResponse::status;
      responseHeader.payloadLength = sizeof(responseHeader);
      responseHeader.temperature = 0; //TODO: Get state
      responseHeader.profileId = -1; // TODO: get state
      responseHeader.status = OperationStatus::idle;      // TODO: get state

      responseHeader.payloadLength = sizeof(responseHeader);

      AsyncResponseStream *response =
          request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
      response->write((uint8_t *)&responseHeader, sizeof(ResponseStatus));
      request->send(response);
    }
  };
  server.on("/api/status", HTTP_POST, mimeGuard, NULL, route);
}

void Route__Post_Skip(AsyncWebServer &server, WebServerState &state) {
  auto route = [&state](AsyncWebServerRequest *request, uint8_t *data,
                        size_t len, size_t index, size_t total) {
    if (index + len == total) {

      log_i("POST STATUS");
      std::span<uint8_t> requestBuffer(data, len);

      const RequestProfileOperation &requestHeader =
          *reinterpret_cast<const RequestProfileOperation *>(
              requestBuffer.data());

      if (!ValidateSecureRequest(request, state, requestBuffer,
                                 WebCommand::profileSkip)) {
        return;
      }

      log_d("[NOT IMPLEMENTED] Modify operation manually here....");

      ResponseSkip responseHeader = {};
      responseHeader.deviceId = DEVICE_ID;
      responseHeader.time = millis();
      responseHeader.timeRollover = 0;
      responseHeader.response = (uint32_t)WebResponse::profileSkip;
      responseHeader.payloadLength = sizeof(responseHeader);
      responseHeader.ok = false; //TODO: Get state
      responseHeader.payloadLength = sizeof(responseHeader);

      AsyncResponseStream *response =
          request->beginResponseStream(MIME_TYPE_APPLICATION_STREAM);
      response->write((uint8_t *)&responseHeader, sizeof(ResponseStatus));
      request->send(response);
    }
  };
  server.on("/api/profile/skip", HTTP_POST, mimeGuard, NULL, route);
}
