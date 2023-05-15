const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = null;

export async function parseCommand(commandCSV) {
  // console.log("commandCSV", commandCSV);
  // order of args passed to ffmpeg.run() is important:
  // ffmpeg -ss <time> -i <input_file> -frames:v 1 <output_file>
  // -ss, 00:00:01.000, -i, input.mov, -frames:v, 1, output.png
  // "-i", "input.mov", "output.mp4"

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

export async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error("Read aborted"));
  });
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

export const initializeFfmpeg = async () => {
  if (ffmpeg === null) {
    ffmpeg = createFFmpeg({
      mainName: "main",
      corePath: "https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js",
    });
  }

  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  return ffmpeg;
};

export const handleFFmpegOperations = async (event) => {
  await initializeFfmpeg();
  const form = event.target;
  let imageObjectUrl = null;
  let videoObjectUrl = null;
  let audioObjectUrl = null;
  const returnObj = {
    imageObjectUrl,
    videoObjectUrl,
    audioObjectUrl,
  };
  const file = form.elements.fileInput.files[0];
  console.log(`file.name`, file.name);

  if (form.elements.operation.value === "screenshot") {
    const timestamp = form.elements.timestamp.value;
    ffmpeg.FS("writeFile", file.name, await fetchFile(file));
    await ffmpeg.run(
      "-i",
      file.name,
      "-ss",
      timestamp,
      "-vframes",
      "1",
      "output.png"
    );
    const data = ffmpeg.FS("readFile", "output.png");
    const fileUrl = URL.createObjectURL(
      new Blob([data.buffer], { type: "image/png" })
    );
    returnObj.imageObjectUrl = fileUrl;
    ffmpeg.FS("unlink", file.name);
    ffmpeg.FS("unlink", "output.png");
    // URL.revokeObjectURL(fileUrl);
  } else if (form.elements.operation.value === "transcode-mp4") {
    ffmpeg.FS("writeFile", file.name, await fetchFile(file));
    await ffmpeg.run("-i", file.name, "output.mp4");

    const data = ffmpeg.FS("readFile", "output.mp4");

    const fileUrl = URL.createObjectURL(
      new Blob([data.buffer], { type: "video/mp4" })
    );
    returnObj.videoObjectUrl = fileUrl;

    ffmpeg.FS("unlink", file.name);
    ffmpeg.FS("unlink", "output.mp4");
    // URL.revokeObjectURL(fileUrl);
  } else if (form.elements.operation.value === "transcode-mp3") {
    ffmpeg.FS("writeFile", file.name, await fetchFile(file));
    await ffmpeg.run("-i", file.name, "-vn", "-ab", "320k", "output.mp3");

    const data = ffmpeg.FS("readFile", "output.mp3");

    const fileUrl = URL.createObjectURL(
      new Blob([data.buffer], { type: "audio/mpeg" })
    );
    returnObj.audioObjectUrl = fileUrl;

    ffmpeg.FS("unlink", file.name);
    ffmpeg.FS("unlink", "output.mp3");
    // URL.revokeObjectURL(fileUrl);
  } else if (form.elements.customCommand.value) {
    const commandText = form.elements.customCommand.value;
    const commandCSV = commandText.split(",");
    console.log("commandCSV", commandCSV);

    let outputData = null;
    const { parsedCommand, inputFile, outputFile } = await parseCommand(
      commandCSV
    );
    console.log(
      "parsedCommand",
      parsedCommand,
      "inputFile",
      inputFile,
      "outputFile",
      outputFile
    );

    // const runFFmpegJob2 = async () => {
    ffmpeg.FS("writeFile", inputFile, await fetchFile(file));
    try {
      await ffmpeg.run(...parsedCommand);
    } catch (error) {
      console.log("error", error);
    }
    outputData = ffmpeg.FS("readFile", outputFile);
    ffmpeg.FS("unlink", inputFile);
    ffmpeg.FS("unlink", outputFile);

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

    // audioObjectUrl
    console.log(`returnObj`, returnObj, "extensionSansDot", extensionSansDot);

    // const fileUrl = URL.createObjectURL(
    //   new Blob([outputData.buffer], { type: "video/mp4" })
    // );
    // returnObj.videoObjectUrl = fileUrl;
    // };
    // runFFmpegJob2();

    // const fileUrl = URL.createObjectURL(
    //   new Blob([data.buffer], { type: "image/png" })
    // );
    // returnObj.imageObjectUrl = fileUrl;

    // const mediaDataURL =
    //   mediaType === "video"
    //     ? new Blob([outputData.buffer], { type: "video/mp4" })
    //     : new Blob([outputData.buffer], { type: "image/png" });
    // mediaType === "video"
    //   ? (returnObj.videoObjectUrl = mediaDataURL)
    //   : (returnObj.imageObjectUrl = mediaDataURL);

    // ffmpeg.FS("writeFile", inputFile, await fetchFile(file));
    // await ffmpeg.run(...commandCSV);
    // const data = ffmpeg.FS("readFile", outputFile);

    // // const fileUrl = URL.createObjectURL(
    // //   new Blob([data.buffer], { type: "image/png" })
    // // );
    // ffmpeg.FS("unlink", inputFile);
    // ffmpeg.FS("unlink", outputFile);

    // await requestQueue.add(async () => {
    //   const { outputData: tempData } = await runFFmpegJob({
    //     parsedCommand,
    //     inputFile,
    //     outputFile,
    //     mediaFile: file,
    //   });
    //   outputData = tempData;
    // });

    // const { mediaDataURL, mediaType } = transformMedia({
    //   file,
    //   command: commandCSV,
    // });
    // mediaType === "video"
    //   ? (returnObj.videoObjectUrl = mediaDataURL)
    //   : (returnObj.imageObjectUrl = mediaDataURL);
  }
  // ffmpeg.FS("unlink", inputFile);
  // ffmpeg.FS("unlink", outputFile);
  return returnObj;
};

// const initializeFFmeg = async () => {
//   const ffmpegInstance = createFFmpeg({ log: true });
//   let ffmpegLoadingPromise = ffmpegInstance.load();

//   async function getFFmpeg() {
//     if (ffmpegLoadingPromise) {
//       await ffmpegLoadingPromise;
//       ffmpegLoadingPromise = undefined;
//     }
//     return ffmpegInstance;
//   }

//   ffmpeg = await getFFmpeg();
// };

export async function runFFmpegJob({
  parsedCommand,
  inputFile,
  outputFile,
  mediaFile,
}) {
  let outputData = null;
  await initializeFfmpeg();
  ffmpeg.FS(
    "writeFile",
    inputFile,
    await fetchFile(mediaFile)
    // await fetchFile(path.join(process.cwd(), "./lib/input.mov"))
  );

  try {
    await ffmpeg.run(...parsedCommand);
  } catch (error) {
    console.log("error", error);
  }

  outputData = ffmpeg.FS("readFile", outputFile);
  ffmpeg.FS("unlink", inputFile);
  ffmpeg.FS("unlink", outputFile);

  // fs.writeFile(outputFile, outputData, "binary", (err) => {
  //   if (err) {
  //     console.error("Error writing the image file:", err);
  //   } else {
  //     console.log("Image file saved successfully:", outputFile);
  //   }
  // });
  return { outputData };
}
