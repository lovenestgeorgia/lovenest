import { Composition } from "remotion";
import { HowItWorksComposition, HOW_IT_WORKS_META } from "./HowItWorks.jsx";

export const RemotionRoot = () => {
    return (
        <Composition
            id="HowItWorks"
            component={HowItWorksComposition}
            durationInFrames={HOW_IT_WORKS_META.durationInFrames}
            fps={HOW_IT_WORKS_META.fps}
            width={HOW_IT_WORKS_META.width}
            height={HOW_IT_WORKS_META.height}
        />
    );
};
