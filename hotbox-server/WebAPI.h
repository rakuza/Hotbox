#include <stdint.h>
#pragma once
#include <ESPAsyncWebServer.h>
#include <array>
#include <cstddef>
#include <cstdint>
#include <memory>
#include <string>
#include <type_traits>
#include <vector>
#include <span>
#include "operationalStatus.h"

/*
TODO:
Authentication on every request
Client->server: create nounce
Server->Client: send nounce
Client->server: send command signed by key+nounce, server destroys nounce
*/
static constexpr uint32_t DEVICE_ID = 0x664b634d; // fKcM - Folfs KilnController Module
static constexpr uint32_t WEBAPI_TIMEOUT = 30 * 1000;
static constexpr uint8_t WEBAPI_NONCE_LEN = 32;

static constexpr char HEADER_CONTENT_TYPE[] = "Content-Type";
static constexpr char MIME_TYPE_APPLICATION_STREAM[] = "application/octet-stream";
static constexpr char MIME_TYPE_TEXT[] = "text/plain; charset=utf-8";

static constexpr int16_t STATUS_BAD_NONCE = 400;
static constexpr int16_t STATUS_BAD_SIGNATURE = 403;
static constexpr int16_t STATUS_BAD_CONTENT = 422;
static constexpr int16_t STATUS_UNSUPPORTED_CONTENT_TYPE = 415;
static constexpr int16_t STATUS_METHOD_NOT_ALLOWED = 405;



using NonceType = std::array<uint8_t, 32>;
using SignatureType = std::array<uint8_t, 32>;

enum class WebCommand : uint32_t {
  heartbeat = 0x77630000,
  status = 0x77630001,
  log = 0x77630002,
  profileUpload = 0x77630103,
  profile = 0x77630104,
  profileAll = 0x77630105,
  profileDelete = 0x77630106,
  profileRunning = 0x77630107,
  manualOperation = 0x77630208,
  profileOperation = 0x77630209,
  profileSkip = 0x77630210,
};

enum class WebResponse : uint32_t {
  heartbeat = 0x77720000,
  status = 0x77720001,
  log = 0x77720002,
  nonce = 0x77720003,
  profileUpload = 0x77720103,
  profile = 0x77720104,
  profileAll = 0x77720105,
  profileDelete = 0x77720106,
  profileRunning = 0x77720107,
  manualOperation = 0x77720208,
  profileOperation = 0x77720209,
  profileSkip = 0x77720210,
};



void SetupRoutes(AsyncWebServer &server);

struct Session {
  NonceType nonce;
  IPAddress ipAddress;
  uint32_t timeoutTick;
};

constexpr const size_t WEBAPI_MAX_SESSIONS = 50;

class WebServerState {
private:
  std::vector<std::unique_ptr<Session>> sessions;

public:
  bool AddSession(NonceType &nonceBuffer, const IPAddress ipAddress);
  bool ClaimOrDestroy(const NonceType &nonceBuffer, const IPAddress ipAddress);
};

bool VerifySignature(std::span<uint8_t> payload);

/**************
 Responses
***************/

struct [[gnu::packed]] ResponseHeader {
  uint32_t deviceId = DEVICE_ID;
  uint32_t time;
  uint32_t timeRollover;
  uint32_t response;
  uint32_t payloadLength;
};

struct ResponseNonce : ResponseHeader {
  NonceType nonce;
};

struct [[gnu::packed]]  ResponseStatus : ResponseHeader {
  uint32_t temperature;
  OperationStatus status;
  int8_t profileId;
};

struct [[gnu::packed]]  ResponseLog : ResponseHeader {
  uint32_t logLength;
};

struct [[gnu::packed]] ResponseHeartbeat : ResponseHeader {
  bool ok;
};

struct [[gnu::packed]] ResponseProfileUpload : ResponseHeader {
  bool ok;
};

struct [[gnu::packed]] ResponseProfileDelete : ResponseHeader{
  bool ok;
};

struct [[gnu::packed]] ResponseProfile : ResponseHeader{
  bool found;
};

struct [[gnu::packed]] ResponseManual : ResponseHeader{
  bool isHeating;
  uint32_t targetTemperature;
};

struct [[gnu::packed]] ResponseProfileOperation: ResponseHeader {
  int8_t profileId;
  OperationStatus status;
};

struct [[gnu::packed]] ResponseProfileAll : ResponseHeader{
  uint8_t profileLen;
};

struct [[gnu::packed]] ResponseSkip : ResponseHeader{
  bool ok;
};


/***********
 Requests
************/
struct RequestHeaderInsecure {
  WebCommand command;
};

struct [[gnu::packed]] RequestHeaderSecure {
  SignatureType signature;
  NonceType nonce;
  WebCommand command;
};

struct RequestHeartbeat : RequestHeaderSecure{
};

struct RequestLog : RequestHeaderSecure{};

struct RequestStatus : RequestHeaderSecure{};

struct [[gnu::packed]]  RequestProfileUpload : RequestHeaderSecure{};

struct [[gnu::packed]]  RequestProfileDelete : RequestHeaderSecure{
  int8_t profileId;
};

struct [[gnu::packed]]  RequestProfile : RequestHeaderSecure{
  int8_t profileId;
};

struct [[gnu::packed]]  RequestProfileOperation: RequestHeaderSecure {
  int8_t profileId;
  OperationStatus requestedStatus;
};

struct [[gnu::packed]]  RequestProfileAll : RequestHeaderSecure{};

struct [[gnu::packed]]  RequestManual : RequestHeaderSecure {
  bool isHeating;
  uint32_t targetTemperature;
};

struct [[gnu::packed]] RequestSkip : RequestHeaderSecure{
  int8_t profileId;
  uint8_t stage;
  uint8_t skipTo;
};

void Route__Get_Root(AsyncWebServer &server);
void Route__Post_AllProfiles(AsyncWebServer &server, WebServerState &state);
void Route__Post_Heartbeat(AsyncWebServer &server, WebServerState &state);
void Route__Get_Nonce(AsyncWebServer &server, WebServerState &state);
void Route__Put_Profile(AsyncWebServer &server, WebServerState &state);