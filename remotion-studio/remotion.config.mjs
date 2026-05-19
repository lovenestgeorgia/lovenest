import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
// Quieter CLI; flip to "verbose" when debugging a render failure.
Config.setLogLevel("info");
