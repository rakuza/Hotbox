#pragma once
#include "ThermalProfile.h"
#include <cstdint>
#include <stdint.h>
#include "operationalStatus.h"
class AppState {
public:
  AppState(const AppState &) = delete;
  AppState &operator=(const AppState &) = delete;
  static AppState &getInstance() {
    static AppState instance;
    return instance;
  }

  uint32_t millisRollover{0};
  uint32_t lastTemp{0};
  OperationStatus status{OperationStatus::idle};
  bool isElementOn{false};
  bool isManual{false};
  uint32_t targetTemp{0};
  ThermalProfile activeProfile;

  private:
    AppState() = default;
};