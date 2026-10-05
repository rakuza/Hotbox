#pragma once
#include <cstddef>
#include <memory>
#include <cstdint>
#include <span>
#include <vector>
#include <type_traits> 
#include <string>

static constexpr uint8_t PROFILE_LIMIT = 30;
static constexpr uint32_t PROFILE_MAGIC = 0x54505246;
static constexpr uint32_t PROFILE_VERSION = 1;


struct [[gnu::packed]] ThermalProfileDTOHeader{
  uint32_t magic;
  uint32_t version;
  uint8_t warmCount;
  uint8_t soakCount;
  uint8_t coolCount;
  uint8_t nameLength;
  uint32_t checksum;
  int8_t id;
};

struct ProfileEntry{
  uint32_t duration;
  uint32_t temperature;
};

struct ThermalProfileDTOBody{
  std::string name;
  std::vector<ProfileEntry> warm;
  std::vector<ProfileEntry> soak;
  std::vector<ProfileEntry> cool;
};

struct ThermalProfileDTO {
  ThermalProfileDTOHeader header;
  ThermalProfileDTOBody body;
};

class ThermalProfile{
  private:


  public:
  ThermalProfile();
  ThermalProfile(uint8_t wSize, uint8_t sSize, uint8_t cSize);
  size_t Size() const;
  bool isValidProfile() const {return isValid;}
  static size_t SerializedSize(std::span<const uint8_t> blob);
  bool Deserialize(std::span<const uint8_t> blob);
  bool Serialize(std::span<uint8_t>& outputBuffer) const;
  bool validate();

    int8_t id = -1;
  std::string name = "empty";
  bool isValid = false;
  std::vector<ProfileEntry> warm;
  std::vector<ProfileEntry> soak;
  std::vector<ProfileEntry> cool;
};