#pragma once
#include <string>

/**
  Reads a string from a buffer
  @param output string
  @param readPtr pointer to the buffer we are reading from
  @param remaining the amount of bytes remaining in the buffer
  @param length how many characters to read
  @returns success status;
*/
bool readString(std::string& output,const uint8_t*& readPtr, size_t& remaining, uint16_t length){
      if (remaining < length) {
        return false;
    } 

    output.assign(
        reinterpret_cast<const char*>(readPtr),
        length
    );

    readPtr += length;
    remaining -= length;

    return true;
}