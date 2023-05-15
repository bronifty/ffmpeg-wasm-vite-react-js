import { runFFmpegJob } from "./ffmpeg.js";
import { atomStatusMessage } from "./nanostore.js";

export async function parseCommand(commandCSV) {
  atomStatusMessage.set("parsing command");
  const arrayWithoutSpaces = commandCSV.map((item) =>
    item
      .replace(
        /`([^`]+)`|'([^']+)'|"([^"]+)"/g,
        (match, templateQuotes, singleQuotes, doubleQuotes) =>
          templateQuotes || singleQuotes || doubleQuotes
      )
      .trim()
  );

  const getFileNames = (parsedCommandArray) => {
    atomStatusMessage.set("getting file names");
    let inputFileName, outputFileName;
    for (let i = 0; i < parsedCommandArray.length; i++) {
      if (parsedCommandArray[i] === "-i" && i < parsedCommandArray.length - 1) {
        inputFileName = parsedCommandArray[i + 1];
      }
      if (i === parsedCommandArray.length - 1) {
        outputFileName = parsedCommandArray[i];
      }
    }
    return { inputFileName, outputFileName };
  };
  const { inputFileName, outputFileName } = getFileNames(arrayWithoutSpaces);
  return { parsedCommand: arrayWithoutSpaces, inputFileName, outputFileName };
}

const checkFileExtension = (file) => {
  atomStatusMessage.set("checking file extension");
  const outputFileName = file; // Example file name, change it according to your scenario

  const extension = outputFileName
    .substr(outputFileName.lastIndexOf("."))
    .toLowerCase();

  let mediaType;

  if (
    extension === ".png" ||
    extension === ".jpg" ||
    extension === ".jpeg" ||
    extension === ".gif"
  ) {
    mediaType = "image";
  } else if (
    extension === ".mp4" ||
    extension === ".avi" ||
    extension === ".mov"
  ) {
    mediaType = "video";
  } else if (extension === ".mp3" || extension === ".m4a") {
    mediaType = "audio";
  } else {
    mediaType = "unknown";
  }

  console.log(`Output File: ${outputFileName}`);
  console.log(`Media Type: ${mediaType}`);
  return { mediaType };
};

const setObjectURL = (outputFileName, outputFileData) => {
  atomStatusMessage.set("setting object URL");
  let returnObj = {
    imageObjectUrl: null,
    videoObjectUrl: null,
    audioObjectUrl: null,
  };
  const { mediaType } = checkFileExtension(outputFileName);
  console.log(`mediaType`, mediaType);

  let extensionSansDot = outputFileName.split(".").pop();

  if (mediaType === "video") {
    const fileUrl = URL.createObjectURL(
      new Blob([outputFileData.buffer], { type: `video/${extensionSansDot}` })
    );
    returnObj.videoObjectUrl = fileUrl;
  } else if (mediaType === "image") {
    const fileUrl = URL.createObjectURL(
      new Blob([outputFileData.buffer], { type: `image/${extensionSansDot}` })
    );
    returnObj.imageObjectUrl = fileUrl;
  } else if (mediaType === "audio") {
    const fileUrl = URL.createObjectURL(
      new Blob([outputFileData.buffer], { type: `audio/mpeg` })
    );
    returnObj.audioObjectUrl = fileUrl;
  }
  console.log(`returnObj`, returnObj);
  return returnObj;
};

export const orchestrateFFmpegOperations = async (event) => {
  atomStatusMessage.set("orchestrating FFmpeg operations");
  const form = event.target;
  const file = form.elements.fileInput.files[0];
  console.log(`file.name`, file.name);
  let returnObj = {
    imageObjectUrl: null,
    videoObjectUrl: null,
    audioObjectUrl: null,
  };
  if (form.elements.operation.value === "screenshot") {
    atomStatusMessage.set("screenshotting");
    const timestamp = form.elements.timestamp.value;
    const commandCSV = [
      "-i",
      file.name,
      "-ss",
      timestamp,
      "-vframes",
      "1",
      "output.png",
    ];
    const { parsedCommand, inputFileName, outputFileName } = await parseCommand(
      commandCSV
    );
    const { outputFileData } = await runFFmpegJob({
      parsedCommand,
      inputFileName,
      outputFileName,
      file,
    });
    returnObj = setObjectURL(outputFileName, outputFileData);
  } else if (form.elements.operation.value === "transcode-mp4") {
    atomStatusMessage.set("transcoding to mp4");
    const commandCSV = ["-i", file.name, "output.mp4"];
    const { parsedCommand, inputFileName, outputFileName } = await parseCommand(
      commandCSV
    );
    const { outputFileData } = await runFFmpegJob({
      parsedCommand,
      inputFileName,
      outputFileName,
      file,
    });
    returnObj = setObjectURL(outputFileName, outputFileData);
  } else if (form.elements.operation.value === "transcode-mp3") {
    atomStatusMessage.set("transcoding to mp3");
    const commandCSV = ["-i", file.name, "-vn", "-ab", "320k", "output.mp3"];
    const { parsedCommand, inputFileName, outputFileName } = await parseCommand(
      commandCSV
    );
    const { outputFileData } = await runFFmpegJob({
      parsedCommand,
      inputFileName,
      outputFileName,
      file,
    });
    returnObj = setObjectURL(outputFileName, outputFileData);
  } else if (form.elements.operation.value === "transcode-gif") {
    atomStatusMessage.set("transcoding to gif");
    const commandCSV = [
      "-i",
      file.name,
      "-vf",
      "fps=10",
      "-c:v",
      "gif",
      "output.gif",
    ];
    const { parsedCommand, inputFileName, outputFileName } = await parseCommand(
      commandCSV
    );
    const { outputFileData } = await runFFmpegJob({
      parsedCommand,
      inputFileName,
      outputFileName,
      file,
    });
    returnObj = setObjectURL(outputFileName, outputFileData);
  } else if (form.elements.customCommand.value) {
    atomStatusMessage.set("running custom command");
    const commandText = form.elements.customCommand.value;
    const commandCSV = commandText.split(",");
    const { parsedCommand, inputFileName, outputFileName } = await parseCommand(
      commandCSV
    );
    const { outputFileData } = await runFFmpegJob({
      parsedCommand,
      inputFileName,
      outputFileName,
      file,
    });
    returnObj = setObjectURL(outputFileName, outputFileData);
  }
  atomStatusMessage.set("done 🐶");
  return returnObj;
};
