import React from "react";
import { useStore } from "@nanostores/react";
import { orchestrateFFmpegOperations, atomStatusMessage } from "../utils";

const Form = () => {
  const [imgElementSrc, setImgElementSrc] = React.useState("");
  const [videoElementSrc, setVideoElementSrc] = React.useState("");
  const [audioElementSrc, setAudioElementSrc] = React.useState("");
  const [operation, setOperation] = React.useState("screenshot");
  const [timestamp, setTimestamp] = React.useState("00:00:01.000");
  const [customCommand, setCustomCommand] = React.useState(
    "-i, input.mov, -vf, fps=10, -c:v, gif, output.gif"
  );
  const atomStatusMessageStore = useStore(atomStatusMessage);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!event.target.elements.fileInput.files.length > 0) {
      return console.log("No file selected");
    }
    const { imageObjectUrl, videoObjectUrl, audioObjectUrl } =
      await orchestrateFFmpegOperations(event);
    if (imageObjectUrl) {
      setImgElementSrc(imageObjectUrl);
    } else if (videoObjectUrl) {
      setVideoElementSrc(videoObjectUrl);
    } else if (audioObjectUrl) {
      setAudioElementSrc(audioObjectUrl);
    }
  };

  const handleOperationChange = (event) => {
    setOperation(event.target.value);
    // console.log(event.target.value);
  };

  const handleTimestampChange = (event) => {
    setTimestamp(event.target.value);
  };

  const handlecustomCommandChange = (event) => {
    setCustomCommand(event.target.value);
    // console.log(event.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center text-gray-200 block p-4">
        <h1 className="text-center text-gray-200 block p-4">
          FFmpeg - Upload a Video and Get a Screenshot, Transcode or Choose
          Custom.
        </h1>
        <h5>
          It's browser ffmpeg.wasm, so no calls to the server and free to host.
        </h5>
        <h6 className="my-2">
          Check the{" "}
          <span className="font-semibold text-purple-500">
            <a href="https://github.com/bronifty/ffmpeg-wasm-vite-react-js">
              github repo
            </a>{" "}
          </span>{" "}
          and submit a PR.
        </h6>
        <p>
          Note: It outputs to mp4 video and png jp[e]g and gif image as well as
          mp3 audio. Other media formats like webm webp and svg don't really
          work.
        </p>
      </div>
      <form
        id="mediaForm"
        name="mediaForm"
        onSubmit={handleSubmit}
        className="grid gap-6 p-8 mt-5 bg-gray-900 rounded shadow-lg w-96">
        <label className="font-semibold text-gray-200" htmlFor="operation">
          Operation
        </label>
        <select
          id="operation"
          name="operation"
          value={operation}
          onChange={handleOperationChange}
          className="p-2 border border-gray-300 rounded">
          <option value="screenshot">Screenshot video</option>
          <option value="transcode-mp4">Transcode video to mp4</option>
          <option value="transcode-mp3">Transcode video to mp3</option>
          <option value="transcode-gif">Transcode video to gif</option>
          <option value="custom">Custom to mp4 mp3 png jp[e]g or gif</option>
        </select>

        {operation === "screenshot" && (
          <>
            <div>
              <label
                className="font-semibold text-gray-200"
                htmlFor="timestamp">
                Timestamp:
              </label>
              <input
                type="text"
                id="timestamp"
                name="timestamp"
                value={timestamp}
                onChange={handleTimestampChange}
                className="block p-2 mt-6 border border-gray-300 rounded"
              />
            </div>
          </>
        )}
        {operation === "custom" && (
          <>
            <div>
              <label
                className="font-semibold text-gray-200"
                htmlFor="customCommand">
                Custom Ffmpeg Command:
              </label>
              <textarea
                id="customCommand"
                name="customCommand"
                value={customCommand}
                onChange={handlecustomCommandChange}
                className="p-2 mt-6 border h-36 border-gray-300 rounded"
              />
            </div>
            <h4 className="text-gray-200">
              Comma separate your commands, with or without single, double, or
              backtick quotes.{" "}
              <span className="text-purple-500">
                Order is important in ffmpeg
              </span>
            </h4>
          </>
        )}

        <label className="font-semibold text-gray-200" htmlFor="fileInput">
          Upload file:
        </label>
        <input
          id="fileInput"
          name="fileInput"
          type="file"
          className="p-2 border border-gray-300 rounded"
        />

        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Submit
        </button>
      </form>

      <h4 className="text-purple-500 text-center m-6">
        {atomStatusMessageStore}
      </h4>

      <div style={{ height: "250px" }}>
        {imgElementSrc && (
          <img className="mt-5 h-48 w-48 object-cover" src={imgElementSrc} />
        )}

        {videoElementSrc && (
          <video
            className="mt-5 h-48 w-48 object-cover"
            src={videoElementSrc}
            controls
          />
        )}
        {audioElementSrc && (
          <audio controls>
            <source src={audioElementSrc} type="audio/mpeg" />
          </audio>
        )}
      </div>
      <footer className="text-purple-500 text-center m-6">
        Brother Nifty 2023
      </footer>
    </div>
  );
};

export default Form;
