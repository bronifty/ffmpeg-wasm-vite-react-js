import { runFFmpegJob } from "./ffmpeg.js";

export async function parseCommand(commandCSV) {
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
    let inputFile, outputFile;
    for (let i = 0; i < parsedCommandArray.length; i++) {
      if (parsedCommandArray[i] === "-i" && i < parsedCommandArray.length - 1) {
        inputFile = parsedCommandArray[i + 1];
      }
      if (i === parsedCommandArray.length - 1) {
        outputFile = parsedCommandArray[i];
      }
    }
    return { inputFile, outputFile };
  };
  const { inputFile, outputFile } = getFileNames(arrayWithoutSpaces);
  return { parsedCommand: arrayWithoutSpaces, inputFile, outputFile };
}

const checkFileExtension = (file) => {
  const outputFile = file; // Example file name, change it according to your scenario

  const extension = outputFile
    .substr(outputFile.lastIndexOf("."))
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

  console.log(`Output File: ${outputFile}`);
  console.log(`Media Type: ${mediaType}`);
  return { mediaType };
};

export const handleFFmpegOperations = async (event) => {
  // await initializeFFmeg();
  const form = event.target;
  const file = form.elements.fileInput.files[0];
  console.log(`file.name`, file.name);

  let imageObjectUrl = null;
  let videoObjectUrl = null;
  let audioObjectUrl = null;
  const returnObj = {
    imageObjectUrl,
    videoObjectUrl,
    audioObjectUrl,
  };

  if (form.elements.operation.value === "screenshot") {
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

    const { parsedCommand, inputFile, outputFile } = await parseCommand(
      commandCSV
    );

    const { outputData } = await runFFmpegJob({
      parsedCommand,
      inputFile,
      outputFile,
      mediaFile: file,
    });

    const fileUrl = URL.createObjectURL(
      new Blob([outputData.buffer], { type: "image/png" })
    );
    returnObj.imageObjectUrl = fileUrl;
  } else if (form.elements.operation.value === "transcode-mp4") {
    const commandCSV = ["-i", file.name, "output.mp4"];
    const { parsedCommand, inputFile, outputFile } = await parseCommand(
      commandCSV
    );
    const { outputData } = await runFFmpegJob({
      parsedCommand,
      inputFile,
      outputFile,
      mediaFile: file,
    });
    const fileUrl = URL.createObjectURL(
      new Blob([outputData.buffer], { type: "video/mp4" })
    );
    returnObj.videoObjectUrl = fileUrl;
  } else if (form.elements.operation.value === "transcode-mp3") {
    const commandCSV = ["-i", file.name, "-vn", "-ab", "320k", "output.mp3"];
    const { parsedCommand, inputFile, outputFile } = await parseCommand(
      commandCSV
    );
    const { outputData } = await runFFmpegJob({
      parsedCommand,
      inputFile,
      outputFile,
      mediaFile: file,
    });
    const fileUrl = URL.createObjectURL(
      new Blob([outputData.buffer], { type: "audio/mpeg" })
    );
    returnObj.audioObjectUrl = fileUrl;
  } else if (form.elements.operation.value === "transcode-gif") {
    const commandCSV = [
      "-i",
      file.name,
      "-vf",
      "fps=10",
      "-c:v",
      "gif",
      "output.gif",
    ];
    const { parsedCommand, inputFile, outputFile } = await parseCommand(
      commandCSV
    );
    const { outputData } = await runFFmpegJob({
      parsedCommand,
      inputFile,
      outputFile,
      mediaFile: file,
    });
    const fileUrl = URL.createObjectURL(
      new Blob([outputData.buffer], { type: "image/gif" })
    );
    returnObj.imageObjectUrl = fileUrl;
  } else if (form.elements.customCommand.value) {
    const commandText = form.elements.customCommand.value;
    const commandCSV = commandText.split(",");
    const { parsedCommand, inputFile, outputFile } = await parseCommand(
      commandCSV
    );
    const { outputData } = await runFFmpegJob({
      parsedCommand,
      inputFile,
      outputFile,
      mediaFile: file,
    });
    const { mediaType } = checkFileExtension(outputFile);
    console.log(`mediaType`, mediaType);

    let extensionSansDot = outputFile.split(".").pop();

    if (mediaType === "video") {
      const fileUrl = URL.createObjectURL(
        new Blob([outputData.buffer], { type: `video/${extensionSansDot}` })
      );
      returnObj.videoObjectUrl = fileUrl;
    } else if (mediaType === "image") {
      const fileUrl = URL.createObjectURL(
        new Blob([outputData.buffer], { type: `image/${extensionSansDot}` })
      );
      returnObj.imageObjectUrl = fileUrl;
    } else if (mediaType === "audio") {
      const fileUrl = URL.createObjectURL(
        new Blob([outputData.buffer], { type: `audio/mpeg` })
      );
      returnObj.audioObjectUrl = fileUrl;
    }
  }
  return returnObj;
};
