#include "Persistence.h"
#include "ThermalProfile.h"
#include "Utils.h"
#include <Preferences.h>
#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <span>
#include <string>
#include <vector>

constexpr const char CONFIG_KEY[] = "a";

/**
  Persistence singleton accessor
  @returns Persistence signleton
*/
Persistence &Persistence::Store() {
  static Persistence instance;
  return instance;
}

/**
Persistence constructor
*/
Persistence::Persistence() {
  Preferences preferences;

  if (!preferences.begin(CONFIG_KEY, true)) {
    return;
  }

  size_t preferenceSize = preferences.getBytesLength(CONFIG_KEY);

  if (preferenceSize == 0) {
    preferences.end();
    return;
  }

  std::vector<uint8_t> buffer(preferenceSize);

  size_t bytesRead =
      preferences.getBytes(CONFIG_KEY, buffer.data(), buffer.size());
  preferences.end();
  if (bytesRead != buffer.size()) {
    return;
  }

  preferences.end();

  if (!Deserialize(buffer)) {
    return;
  }
}

bool Persistence::Deserialize(std::span<const uint8_t> data) {
  if (data.size() < sizeof(ConfigHeader)) {
    return false;
  }

  const ConfigHeader *header =
      reinterpret_cast<const ConfigHeader *>(data.data());

  if (header->magic != CONFIG_MAGIC) {
    log_e("Magic failed to match");
    return false;
  }

  if (header->version != CONFIG_VERSION) {
    log_e("config version mismatch");
    return false;
  }

  if (header->profileCount > PROFILE_LIMIT) {
    log_e("Too many profiles");
    return false;
  }

  const uint8_t *readPtr = data.data() + sizeof(ConfigHeader);
  size_t remaining = data.size() - sizeof(ConfigHeader);

  if (!readString(_config.ssid, readPtr, remaining, header->ssidLen)) {
    return false;
  }
  if (!readString(_config.psk, readPtr, remaining, header->pskLen)) {
    return false;
  }

  _config.profiles.clear();
  _config.profiles.reserve(header->profileCount);

  if (header->profileCount == 0) {
    return true;
  }
  for (uint8_t i = 0; i < header->profileCount; i++) {
    size_t profileSize = ThermalProfile::SerializedSize(
        std::span<const uint8_t>(readPtr, remaining));

    if (profileSize == 0) {
      return false;
    }
    ThermalProfile profile;
    profile.Deserialize(std::span<const uint8_t>(readPtr, profileSize));

    _config.profiles.push_back(profile);

    readPtr += profileSize;
    remaining -= profileSize;
  }

  if (remaining != 0) {
    return false;
  }

  return true;
}

void Persistence::Commit() {

  size_t payloadSize = _config.ssid.length() + _config.psk.length();

  std::vector<size_t> profileSizes;
  profileSizes.reserve(_config.profiles.size());

  for (const auto &profile : _config.profiles) {
    size_t pSize = profile.Size();
    profileSizes.push_back(pSize);
    payloadSize += pSize;
  }

  size_t totalSize = sizeof(ConfigHeader) + payloadSize;
  std::vector<uint8_t> buffer(totalSize);

  ConfigHeader *header = reinterpret_cast<ConfigHeader *>(buffer.data());
  header->magic = CONFIG_MAGIC;
  header->version = CONFIG_VERSION;
  header->pskLen = static_cast<uint16_t>(_config.psk.length());
  header->ssidLen = static_cast<uint16_t>(_config.ssid.length());
  header->profileCount = static_cast<uint8_t>(_config.profiles.size());

  uint8_t *writePtr = buffer.data() + sizeof(ConfigHeader);

  std::memcpy(writePtr, _config.ssid.data(), _config.ssid.length());
  writePtr += _config.ssid.length();

  std::memcpy(writePtr, _config.psk.data(), _config.psk.length());
  writePtr += _config.psk.length();

  for (size_t i = 0; i < _config.profiles.size(); ++i) {
    std::span<uint8_t> outputSpan(writePtr, profileSizes[i]);
    if (!_config.profiles[i].Serialize(outputSpan)) {
      log_e("Failed to serialize thermal profile");
      return;
    }
    writePtr += profileSizes[i];
  }
  Preferences preferences;
  if (!preferences.begin(CONFIG_KEY, false)) {
    log_e("Failed to open Preferences for writing");
    return;
  }

  size_t bytesWritten =
      preferences.putBytes(CONFIG_KEY, buffer.data(), buffer.size());
  preferences.end();

  if (bytesWritten != buffer.size()) {

    log_e("Flash write mismatch / incomplete commit");
  }
}

void Persistence::setWifiPsk(const std::string &psk) { _config.psk = psk; }

std::string Persistence::getWifiPsk() const { return _config.psk; }

void Persistence::setWifiSsid(const std::string &ssid) { _config.ssid = ssid; }

std::string Persistence::getWifiSsid() const { return _config.ssid; }

bool Persistence::getThermalProfile(ThermalProfile &out, int8_t index) {
  auto it = std::find_if(
      _config.profiles.begin(), _config.profiles.end(),
      [index](const ThermalProfile &profile) { return profile.id == index; });

  if (it != _config.profiles.end()) {
    out = *it;
    return true;
  }
  return false;
}

const std::vector<ThermalProfile> &Persistence::getProfileCollection() const {
  return _config.profiles;
}

void Persistence::setThermalProfile(ThermalProfile &profile) {

  if (profile.id == -1) {
    profile.id = _config.profiles.size() + 1;
    _config.profiles.push_back(profile);

    return;
  }

  _config.profiles[profile.id - 1] = profile;
}

bool Persistence::deleteThermalProfile(const int8_t id) {
  auto it = std::find_if(_config.profiles.begin(), _config.profiles.end(),
                         [id](const ThermalProfile &p) { return p.id == id; });

  if (it != _config.profiles.end()) {
    _config.profiles.erase(it);
    return true;
  }

  return false;
}