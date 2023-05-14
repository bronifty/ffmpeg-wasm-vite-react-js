import React, { useState } from "react";
import { handleFFmpegOperations } from "../utils/ffmpegUtils";

const Form = () => {
  const [imgElementSrc, setImgElementSrc] = useState("");
  const [videoElementSrc, setVideoElementSrc] = useState("");
  const [message, setMessage] = useState("");
  const [operation, setOperation] = useState("screenshot");
  const [customCommand, setCustomCommand] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!event.target.elements.fileInput.files.length > 0) {
      return console.log("No file selected");
    }
    setMessage("processing ffmpeg job");
    const { imageObjectUrl, videoObjectUrl } = await handleFFmpegOperations(
      event
    );
    if (imageObjectUrl) {
      setImgElementSrc(imageObjectUrl);
    } else if (videoObjectUrl) {
      setVideoElementSrc(videoObjectUrl);
    }
    setMessage(null);
  };

  const handleOperationChange = (event) => {
    setOperation(event.target.value);
    // console.log(event.target.value);
  };

  const handlecustomCommandChange = (event) => {
    setCustomCommand(event.target.value);
    // console.log(event.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
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
          <option value="screenshot">Screenshot</option>
          <option value="transcode">Transcode</option>
          <option value="custom">Custom</option>
        </select>

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
                className="p-2 mt-6 border h-36 border-gray-300 rounded custom-textfield"
              />
            </div>
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

      <div>
        {message && (
          <div className="mt-5 p-2 w-full h-48 text-white bg-red-500">
            {message}
          </div>
        )}
      </div>
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
      </div>
    </div>
  );
};

export default Form;
