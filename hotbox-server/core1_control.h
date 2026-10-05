#pragma once
#include <Arduino.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"


#define ENABLE_MAX31855 0
#if ENABLE_MAX31855
#include <MAX31855.h>
extern MAX31855 thermocouple;
#endif

#define ENABLE_MAX6675 1
#if ENABLE_MAX6675
#include <MAX6675.h>
extern MAX6675 thermocouple;
#endif



static constexpr uint32_t THERMOCOUPLE_READ_WAIT = 500;
// TaskHandle_t Core1TaskHandle = NULL;
void deviceTask(void *pvParameters);