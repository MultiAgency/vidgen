import React from "react";
import { Composition, staticFile } from "remotion";
import "./fonts";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { MascotPost } from "./MascotPost";
import { AUDIO_START, OUTRO } from "./timing";
import { ClipSource } from "./ClipSource";
import { MascotSample } from "./MascotSample";
import { THUMBS, Thumb } from "./Thumb";
import { POSTS, Post } from "./posts";

const FPS = 30;

const durationFor = async (post: Post): Promise<number> => {
  try {
    const audio = await getAudioDurationInSeconds(
      staticFile(`audio/${post.slug}.mp3`),
    );
    return AUDIO_START + audio + OUTRO;
  } catch {
    // No mp3 — a mock voiceover may still have written word timings.
    try {
      const res = await fetch(staticFile(`audio/${post.slug}.words.json`));
      if (res.ok) {
        const timings = await res.json();
        return AUDIO_START + timings.durationSeconds + OUTRO;
      }
    } catch {
      // fall through
    }
    // Nothing generated yet — use the post's estimate so the composition
    // still previews and renders.
    return post.fallbackDurationSeconds;
  }
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="mascot-sample"
        component={MascotSample}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={22 * FPS}
      />
      <Composition
        id="clip-source"
        component={ClipSource}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={3 * FPS}
      />
      {Object.entries(THUMBS).map(([slug, spec]) => (
        <Composition
          key={slug}
          id={`thumb-${slug}`}
          component={Thumb}
          defaultProps={{ spec }}
          fps={FPS}
          width={1280}
          height={720}
          durationInFrames={1}
        />
      ))}
      {POSTS.map((post) => {
        const calculateMetadata = async () => ({
          durationInFrames: Math.ceil((await durationFor(post)) * FPS),
        });
        return (
          <React.Fragment key={post.slug}>
            <Composition
              id={post.slug}
              component={MascotPost}
              defaultProps={{ post }}
              calculateMetadata={calculateMetadata}
              fps={FPS}
              width={1920}
              height={1080}
              durationInFrames={post.fallbackDurationSeconds * FPS}
            />
            <Composition
              id={`${post.slug}-square`}
              component={MascotPost}
              defaultProps={{ post }}
              calculateMetadata={calculateMetadata}
              fps={FPS}
              width={1080}
              height={1080}
              durationInFrames={post.fallbackDurationSeconds * FPS}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};
