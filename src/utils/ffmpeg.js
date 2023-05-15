import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
let ffmpeg = null;

const initializeFFmeg = async () => {
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
  inputFile,
  outputFile,
  mediaFile,
}) {
  let outputData = null;
  await initializeFFmeg();
  ffmpeg.FS("writeFile", inputFile, await fetchFile(mediaFile));
  try {
    await ffmpeg.run(...parsedCommand);
  } catch (error) {
    console.log("error", error);
  }
  outputData = ffmpeg.FS("readFile", outputFile);
  ffmpeg.FS("unlink", inputFile);
  ffmpeg.FS("unlink", outputFile);
  return { outputData };
}
