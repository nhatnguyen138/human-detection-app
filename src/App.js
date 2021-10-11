import React, { useRef, useState } from 'react'
import "@tensorflow/tfjs-backend-cpu";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import styled from 'styled-components'

const AppContainer = styled.div`
  width: calc(100% + 16px);
  height: 100%;
  min-height: 100vh;
  margin: -8px;
  background-color: #1c2127;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

const HumanDetectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ImageContainer = styled.div`
  min-width: 200px;
  max-width: 90vw;
  max-height: 700px;
  border: 3px solid #fff;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: "Human Detection App";
    background-color: #fff;
    padding: 2px;
    margin-top: -5px;
    margin-left: 5px;
    color: black;
    font-weight: 500;
    font-size: 17px;
    position: absolute;
    top: -1.5em;
    left: -5px;
  }
`;

const TargetImg = styled.img`
  height: 100%;
`;

const FileLoader = styled.input`
  display: none;
`;

const SelectButton = styled.button`
  padding: 7px 10px;
  border: 2px solid transparent;
  background-color: #fff;
  color: #0a0f22;
  font-size: 16px;
  font-weight: 500;
  outline: none;
  margin-top: 2em;
  cursor: pointer;
  transition: all 260ms ease-in-out;

  &:hover {
    background-color: transparent;
    border: 2px solid #fff;
    color: #fff;
  }
`;

const TargetBox = styled.div`
  position: absolute;

  left: ${({ x }) => x + "px"};
  top: ${({ y }) => y + "px"};
  width: ${({ width }) => width + "px"};
  height: ${({ height }) => height + "px"};

  border: 4px solid #e3e3dc;
  background-color: transparent;
  z-index: 20;

  &::before {
    content: "${({ classType, score }) => `${classType} ${score.toFixed(1)}%`}";
    background-color: #e3e3dc;
    padding: 2px;
    margin-top: -5px;
    color: black;
    font-weight: 500;
    font-size: 17px;
    position: absolute;
    top: -1.5em;
    left: -5px;
  }
`;

const HumanTargetBox = styled.div`
  position: absolute;

  left: ${({ x }) => x + "px"};
  top: ${({ y }) => y + "px"};
  width: ${({ width }) => width + "px"};
  height: ${({ height }) => height + "px"};

  border: 4px solid #1ac71a;
  background-color: transparent;
  z-index: 20;

  &::before {
    content: "${({ classType, score }) => `${classType} ${score.toFixed(1)}%`}";
    background-color: #1ac71a;
    padding: 2px;
    margin-top: -5px;
    color: white;
    font-weight: 500;
    font-size: 17px;
    position: absolute;
    top: -1.5em;
    left: -5px;
  }
`;

export default function App() {
  const fileInputRef = useRef();
  const imageRef = useRef();
  const [imgData, setImgData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setLoading] = useState(false);

  const isEmptyPredictions = !predictions || predictions.length === 0;

  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const normalizePredictions = (predictions, imgSize) => {
    if (!predictions || !imgSize || !imageRef) return predictions || [];
    return predictions.map((prediction) => {
      const { bbox } = prediction;
      const oldX = bbox[0];
      const oldY = bbox[1];
      const oldWidth = bbox[2];
      const oldHeight = bbox[3];

      const imgWidth = imageRef.current.width;
      const imgHeight = imageRef.current.height;

      const x = (oldX * imgWidth) / imgSize.width;
      const y = (oldY * imgHeight) / imgSize.height;
      const width = (oldWidth * imgWidth) / imgSize.width;
      const height = (oldHeight * imgHeight) / imgSize.height;

      return { ...prediction, bbox: [x, y, width, height] };
    });
  };

  const detectObjectsOnImage = async (imageElement, imgSize) => {
    const model = await cocoSsd.load({});
    const predictions = await model.detect(imageElement, 6);
    const normalizedPredictions = normalizePredictions(predictions, imgSize);
    setPredictions(normalizedPredictions);
    console.log("Predictions: ", predictions);
  };

  const readImage = (file) => {
    return new Promise((rs, rj) => {
      const fileReader = new FileReader();
      fileReader.onload = () => rs(fileReader.result);
      fileReader.onerror = () => rj(fileReader.error);
      fileReader.readAsDataURL(file);
    });
  };

  const onSelectImage = async (e) => {
    setPredictions([]);
    setLoading(true);

    const file = e.target.files[0];
    const imgData = await readImage(file);
    setImgData(imgData);

    const imageElement = document.createElement("img");
    imageElement.src = imgData;

    imageElement.onload = async () => {
      const imgSize = {
        width: imageElement.width,
        height: imageElement.height,
      };
      await detectObjectsOnImage(imageElement, imgSize);
      setLoading(false);
    };
  };
  return (
    <AppContainer>
      <HumanDetectorContainer>
        <ImageContainer>
          {imgData && <TargetImg src={imgData} ref={imageRef} style={{width:"min(90vw,100%)", maxHeight:"700px"}} />}
          {!isEmptyPredictions &&
            <>
              {
                predictions.map((prediction, idx) => {
                  if (prediction.class !== "person")
                    return (
                      <TargetBox
                        key={idx}
                        x={prediction.bbox[0]}
                        y={prediction.bbox[1]}
                        width={prediction.bbox[2]}
                        height={prediction.bbox[3]}
                        classType={prediction.class}
                        score={prediction.score * 100}
                      />
                    )
                })
              }
              {
                predictions.map((prediction, idx) => {
                  if (prediction.class === "person")
                    return (
                      <HumanTargetBox
                        key={idx}
                        x={prediction.bbox[0]}
                        y={prediction.bbox[1]}
                        width={prediction.bbox[2]}
                        height={prediction.bbox[3]}
                        classType={prediction.class}
                        score={prediction.score * 100}
                      />
                    )
                })
              }
            </> 
          }
        </ImageContainer>
        <FileLoader
          type="file"
          ref={fileInputRef}
          onChange={onSelectImage}
        />
        <SelectButton onClick={openFilePicker}>
          {isLoading ? "Analysing..." : "Select Image"}
        </SelectButton>
      </HumanDetectorContainer>
    </AppContainer>
  )
}