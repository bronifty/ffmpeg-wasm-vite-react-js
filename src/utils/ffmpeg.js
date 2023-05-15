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
  inputFileName,
  outputFileName,
  file,
}) {
  let outputFileData = null;
  await initializeFFmeg();
  ffmpeg.FS("writeFile", inputFileName, await fetchFile(file));
  try {
    await ffmpeg.run(...parsedCommand);
  } catch (error) {
    console.log("error", error);
  }
  outputFileData = ffmpeg.FS("readFile", outputFileName);
  ffmpeg.FS("unlink", inputFileName);
  ffmpeg.FS("unlink", outputFileName);
  return { outputFileData };
}
