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

function checkMediaType(extension) {
  switch (extension) {
    case "mp4":
    case "mov":
    case "avi":
      return "video";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image";
    case "mp3":
    case "m4a":
    case "flac":
      return "audio";
    default:
      return null;
  }
}

function setObjectURL({ outputFileName, outputFileData }) {
  const extensionSansDot = outputFileName.split(".").pop();
  const extensionMimeType = checkMediaType(extensionSansDot);

  if (extensionMimeType) {
    const fileUrl = URL.createObjectURL(
      new Blob([outputFileData.buffer], {
        type: `${extensionMimeType}/${extensionSansDot}`,
      })
    );

    return {
      [`${extensionMimeType}ObjectUrl`]: fileUrl,
    };
  } else {
    console.error("Unsupported media type");
    return null;
  }
}

const composeFFmpegJob = async ({ file, commandCSV }) => {
  const { parsedCommand, inputFileName, outputFileName } = await parseCommand(
    commandCSV
  );
  const { outputFileData } = await runFFmpegJob({
    parsedCommand,
    inputFileName,
    outputFileName,
    file,
  });
  let returnObj = setObjectURL({ outputFileName, outputFileData });
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
    returnObj = await composeFFmpegJob({ file, commandCSV });
  } else if (form.elements.operation.value === "transcode-mp4") {
    atomStatusMessage.set(
      "transcoding to mp4 trying new composeFFmpegJob function"
    );
    const commandCSV = ["-i", file.name, "output.mp4"];
    returnObj = await composeFFmpegJob({ file, commandCSV });
  } else if (form.elements.operation.value === "transcode-mp3") {
    atomStatusMessage.set("transcoding to mp3");
    const commandCSV = ["-i", file.name, "-vn", "-ab", "320k", "output.mp3"];
    returnObj = await composeFFmpegJob({ file, commandCSV });
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
    returnObj = await composeFFmpegJob({ file, commandCSV });
  } else if (form.elements.customCommand.value) {
    atomStatusMessage.set("running custom command");
    const commandText = form.elements.customCommand.value;
    const commandCSV = commandText.split(",");
    returnObj = await composeFFmpegJob({ file, commandCSV });
  }
  atomStatusMessage.set("done 🐶");
  return returnObj;
};
