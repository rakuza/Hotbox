#include "esp32-hal-log.h"
#pragma once
#include <cstring>
#include <cstddef>
#include <cstdint>
#include "ThermalProfile.h"
#include <span>
#include <string>
#include <vector>
#include <rom/crc.h> 
#include "Utils.h"

ThermalProfile::ThermalProfile(){
  name = "empty";
  isValid = false;
}

ThermalProfile::ThermalProfile(uint8_t wSize, uint8_t sSize, uint8_t cSize){
  warm.resize(wSize);
  soak.resize(sSize);
  cool.resize(cSize);
  name = "empty";
}

/**
  Converts a ThermalProfile To a ThermalProfileDTO in the form of a buffer
  @param outputBuffer a presized output buffer
  @returns success
*/
bool ThermalProfile::Serialize(std::span<uint8_t>& outputBuffer) const{
  size_t warmSize = warm.size() * sizeof(ProfileEntry);
  size_t soakSize   = soak.size() * sizeof(ProfileEntry);
  size_t coolSize   = cool.size() * sizeof(ProfileEntry);

  size_t totalSize = sizeof(ThermalProfileDTOHeader) + warmSize + soakSize + coolSize + name.length();
  if(outputBuffer.size() < totalSize){
    log_e("Buffer too small!");
    return false;
  }
  uint8_t* writePtr = outputBuffer.data();

  ThermalProfileDTOHeader header;
  header.magic = PROFILE_MAGIC; // 'TPRF' (Thermal Profile)
  header.version = PROFILE_VERSION;
  header.warmCount = warm.size();
  header.soakCount = soak.size();
  header.coolCount = cool.size();
  header.nameLength = name.length();
  header.checksum = 0;
  header.id = id;



  std::memcpy(writePtr, &header, sizeof(ThermalProfileDTOHeader));
  writePtr += sizeof(ThermalProfileDTOHeader);

  if (name.length() > 0) {
    std::memcpy(writePtr, name.data() ,name.length());
    writePtr += name.length();
  }


  auto copyToBlob = [&](const auto& profileEntries){
    size_t byteSize = profileEntries.size() * sizeof(ProfileEntry);
    if(byteSize > 0) {
      std::memcpy(writePtr, profileEntries.data(), byteSize);
      writePtr += byteSize;
    }
  };
  copyToBlob(warm);
  copyToBlob(soak);
  copyToBlob(cool);


// CRC32 of everything after the checksum field
  size_t checksumOffset = offsetof(ThermalProfileDTOHeader, checksum) + sizeof(header.checksum);
  size_t bytesToHash = totalSize - checksumOffset;
  
  uint32_t calculatedCrc = crc32_le(0, outputBuffer.data() + checksumOffset, bytesToHash);

  // Inject checksum back into the blob header
  auto* finalizedHeader = reinterpret_cast<ThermalProfileDTOHeader*>(outputBuffer.data());
  finalizedHeader->checksum = calculatedCrc;

  return true;
}

size_t ThermalProfile::SerializedSize(std::span<const uint8_t> blob){
  if(blob.size() < sizeof(ThermalProfileDTOHeader)){
    return 0;
  }

  const ThermalProfileDTOHeader* header = reinterpret_cast<const ThermalProfileDTOHeader*>(blob.data());

  if(header->magic != PROFILE_MAGIC){
    return 0;
  }

  size_t size = sizeof(ThermalProfileDTOHeader) + 
  (sizeof(ProfileEntry) * (header->warmCount + header->soakCount + header->coolCount )) +
  header->nameLength;

  if(size > blob.size()){
    return 0;
  }

  return size;
}

/**
  Converts a blob into a thermalProfile
  @param blob a span representing the binary blob
  @returns if the operation succeeded
*/
bool ThermalProfile::Deserialize(std::span<const uint8_t> blob)
{
  if (blob.size() < sizeof(ThermalProfileDTOHeader)) {
    log_e("Blob smaller than header");
    return false; 
  }

  const auto* header = reinterpret_cast<const ThermalProfileDTOHeader*>(blob.data());
  size_t warmSize = header->warmCount * sizeof(ProfileEntry);
  size_t soakSize   = header->soakCount * sizeof(ProfileEntry);
  size_t coolSize   = header->coolCount * sizeof(ProfileEntry);
  size_t nameLen   = header->nameLength;

  if( header->magic != PROFILE_MAGIC){
    log_e("Magic doesnt match, corrupted?");
    return false;
  }

  if(header->version != PROFILE_VERSION){
    log_e("Incorrect version");
    return false;
  }

  if(blob.size() != (sizeof(ThermalProfileDTOHeader) +(( warmSize + soakSize + coolSize)) + nameLen)){
    log_e("Blob does not match expected file size");
    return false;
  }

  size_t checksumOffset = offsetof(ThermalProfileDTOHeader, checksum) + sizeof(header->checksum) + 1;
  size_t bytesToHash = blob.size() - checksumOffset;
  uint32_t expectedCrc = crc32_le(0, blob.data() + checksumOffset, bytesToHash);

  if (header->checksum != expectedCrc) {
      log_e("corrupt profile");
      return false;
  }
  
  id = header->id;
  warm.resize(header->warmCount);
  soak.resize(header->soakCount);
  cool.resize(header->coolCount);  

  const uint8_t* readPtr = blob.data() + sizeof(ThermalProfileDTOHeader);
    if (nameLen > 0) {
      size_t buffersize = blob.size();
      if(!readString(name, readPtr, buffersize, nameLen)){
        log_e("Profile name read error?");
        return false;
      }
  }
  else {
    name = "empty";
  }
  auto copyFromBlob = [&](void* dest, size_t bytes){
    if(bytes > 0){
      std::memcpy(dest,readPtr,bytes);
      readPtr += bytes;
    }
  };

  copyFromBlob(warm.data(),warmSize);
  copyFromBlob(soak.data(),soakSize);
  copyFromBlob(cool.data(),coolSize);

  return true;
}

/**
  Validates if a thermal profile is valid
  @returns isvalid
 */
bool ThermalProfile::validate(){
    if(name.length() < 1 || soak.size() < 1 || warm.size() < 1 || cool.size() < 1){
      isValid = false;
      return false;
    }

    isValid = true;
    return true;
}

/**
  Calculates the size of the thermalProfile When serialized
  @returns byte size
*/
size_t ThermalProfile::Size() const{
  return 
  sizeof(ThermalProfileDTOHeader) +
  (
    (
    warm.size() + 
    soak.size()  + 
    cool.size()
    ) * sizeof(ProfileEntry)
  )+ name.length();
}