#pragma once
#include <vector>
#include <string>
#include <cstdint>

#include "ThermalProfile.h"

static constexpr uint32_t CONFIG_MAGIC = 0x434F4E46;
static constexpr uint32_t CONFIG_VERSION = 1;

   #pragma pack(push, 1)
struct ConfigHeader{
  uint32_t magic;
  uint32_t version;
  uint32_t profileCount;
  uint16_t ssidLen;
  uint16_t pskLen;
};
  #pragma pack(pop)

struct Config{
  std::string ssid;
  std::string psk;
  std::vector<ThermalProfile> profiles;
};

class Persistence{
  public:
  static Persistence& Store();
  std::string getWifiSsid() const;
  std::string getWifiPsk() const;
  void setWifiSsid(const std::string&);
  void setWifiPsk(const std::string&);
  const std::vector<ThermalProfile>& getProfileCollection() const;
  bool getThermalProfile(ThermalProfile& profile, int8_t index);
  void setThermalProfile(ThermalProfile& profile);
  bool deleteThermalProfile(const int8_t id);
  void Commit();

  private:
  Persistence();
  Persistence(const Persistence&) = delete;
  Persistence& operator=(const Persistence&) = delete;
  Config _config;
  bool Deserialize(std::span<const uint8_t> data);
};