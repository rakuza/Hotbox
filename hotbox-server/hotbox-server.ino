#pragma once
#include "log.h"
#include <LittleFS.h>
#include <Preferences.h>
#include <SPI.h>
#include <WebAPI.h>
#include <WiFi.h>
#include <cstdint>
#include <rom/rtc.h>
#include <sys/types.h>
#include "State.h"
#include "PIDController.h"
#include "core1_control.h"
#include "core0__interface.h"
#define BTN_UP 32
#define BTN_DOWN 33
#define BTN_SELECT 25

#define SPI_MOSI 11
#define SPI_MISO 13
#define SPI_SCK 12

extern constexpr uint8_t TEMP_CS = 5;
extern constexpr uint8_t RELAY = 7;


// #define TFT_CS 5
// #define TFT_RST 14
// #define TFT_DC 37
#define ENABLE_MAX31855 0
#if ENABLE_MAX31855
#include <MAX31855.h>
extern MAX31855 thermocouple(TEMP_CS, &SPI);
#endif

#define ENABLE_MAX6675 1
#if ENABLE_MAX6675
#include <MAX6675.h>
extern MAX6675 thermocouple(TEMP_CS, &SPI);
#endif


#define RELAY_ELEMENT 18

#define ENABLE_TFT 0
#if ENABLE_TFT
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#endif


#define FORMAT_LITTLEFS_IF_FAILED true

Preferences p;
AsyncWebServer server(80);


// Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);
void setup() {
    pinMode(RELAY, OUTPUT); 
  //Start Serial first for debug
  Serial.setTxBufferSize(4096); 
  Serial.begin(230400);
  Serial.setTxTimeoutMs(0); 
  Serial.setDebugOutput(true);
  esp_log_level_set("esp32-hal-uart",    ESP_LOG_NONE);
  esp_log_level_set("esp32-hal-periman", ESP_LOG_NONE);
  esp_log_level_set("esp32-hal-rgb-led", ESP_LOG_NONE);
  esp_log_level_set("esp32-hal-rmt",     ESP_LOG_NONE);
  esp_log_level_set("esp32-hal-psram",   ESP_LOG_NONE);
  esp_log_level_set("NetworkEvents",     ESP_LOG_NONE);
  esp_log_level_set("STA",               ESP_LOG_NONE);
  esp_log_level_set("esp32-hal-gpio", ESP_LOG_NONE);


  rgbLedWrite(RGB_BUILTIN, 0, 0, 255);
  do {
    delay(1); // wait for neo pixel to catch up
  } while (!Serial && Serial.availableForWrite() == 0);
  rgbLedWrite(RGB_BUILTIN, 0, 0, 0);

  if (!Logger::begin()) {
    log_i("Logging disabled");
  }

  //Load littleFS and format if flagged
  if (!LittleFS.begin(FORMAT_LITTLEFS_IF_FAILED)) {
  log_e("Error: Filesystem not able to mount");
  return;
  }

  //load preferences
  //TODO replace with fetching wifi credientials
  p.begin("a", false);
  p.clear();
  p.end();

  //start wifi
  WiFi.begin("WokFi", "Z9Cuh4dQ6rWeQQU");

  //Load webserver host

  SetupRoutes(server);
  server.begin();

  pinMode(SPI_MISO, INPUT_PULLUP);


  SPI.begin(SPI_SCK, SPI_MISO, SPI_MOSI, -1);

  thermocouple.begin();
  boot__hello();
  xTaskCreatePinnedToCore(uiTask, "UITask", 16384, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(deviceTask, "DeviceTask", 2048, NULL, 1, NULL, 1);

}

void loop() {
  vTaskDelete(NULL);
}

void boot__hello() {
  log_i("\n====================================");
  log_i("Kiln Controller v0.1");
  log_i("ESP32-S3 BOOT SUCCESSFUL");
  log_i("Build Timestamp: %s @ %s",__DATE__, __TIME__);
  log_i("====================================");
  return;
}

void boot__peripheral_check() {

  /* Max 31855 or Max6675*/
  ushort thermocouple_status = thermocouple.read();
  if (thermocouple_status != 0) {
    if (thermocouple_status == 129) {
      log_e("Error: Thermal sensor not detected!");
    } else if (thermocouple_status == 4) {
      log_e("Error: Thermal sensor error!");
    }
    log_d("[DEBUG] Error state bypassed");
    return;
  }
}
