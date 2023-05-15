import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { atomStatusMessage } from "./nanostore.js";
let ffmpeg = null;

const initializeFFmeg = async () => {
  atomStatusMessage.set("Loading ffmpeg-core.js");
  const ffmpegInstance = createFFmpeg({
    mainName: "main",
    corePath: "https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js",
    log: true,
  });
  let ffmpegLoadingPromise = ffmpegInstance.load();
  async function getFFmpeg() {
    if (ffmpegLoadingPromise) {
      await ffmpegLoadingPromise;
      ffmpegLoadingPromise = undefined;
    }
    return ffmpegInstance;
  }
  ffmpeg = await getFFmpeg();
};

export async function runFFmpegJob({
  parsedCommand,
  inputFileName,
  outputFileName,
  file,
}) {
  let outputFileData = null;
  await initializeFFmeg();
  atomStatusMessage.set("writing file to memory");
  ffmpeg.FS("writeFile", inputFileName, await fetchFile(file));
  try {
    atomStatusMessage.set("running ffmpeg command");
    await ffmpeg.run(...parsedCommand);
  } catch (error) {
    console.log("error", error);
  }
  atomStatusMessage.set("reading output file from memory");
  outputFileData = ffmpeg.FS("readFile", outputFileName);
  atomStatusMessage.set("unlinking input and output files");
  ffmpeg.FS("unlink", inputFileName);
  ffmpeg.FS("unlink", outputFileName);
  return { outputFileData };
}
