
"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiVolume2,
  FiLoader,
} from "react-icons/fi";

import type { LessonWord } from "@/lib/student/lesson-detail";

interface Props {
  words: LessonWord[];
  onComplete: () => void;
}

export default function LearningStage({ words, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  if (!words.length) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h2 className="text-2xl font-bold">You know all these words!</h2>
        <p className="mt-2 text-zinc-500">Let's move on to practice.</p>

        <button
          onClick={onComplete}
          className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-white"
        >
          Continue
        </button>
      </div>
    );
  }

  const word = words[index];
  const sense = word.senses[0];
  const example = sense?.examples[0];

  const groupNumber = Math.floor(index / 5) + 1;
  const groupEnd = Math.min(groupNumber * 5, words.length);

  const playAudio = async () => {
    if (!word.audioUrl) return;

    try {
      // Stop any previously playing audio.
      audioRef.current?.pause();

      const audio = new Audio(word.audioUrl);
      audioRef.current = audio;

      setIsLoadingAudio(true);
      setIsPlaying(false);

      audio.oncanplay = () => {
        setIsLoadingAudio(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsLoadingAudio(false);
        setIsPlaying(false);
        console.error("Failed to load pronunciation audio:", word.word);
      };

      await audio.play();

      setIsLoadingAudio(false);
      setIsPlaying(true);
    } catch (error) {
      setIsLoadingAudio(false);
      setIsPlaying(false);
      console.error("Audio playback error:", error);
    }
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  const goToWord = (nextIndex: number) => {
    stopAudio();
    setIndex(nextIndex);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-violet-600">
        STAGE 2 · LEARNING
      </p>

      <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
        <span>
          Group {groupNumber} of {Math.ceil(words.length / 5)}
        </span>
        <span>
          {index + 1} of {words.length} words
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-violet-600 transition-all"
          style={{ width: `${((index + 1) / words.length) * 100}%` }}
        />
      </div>

      <div className="mt-7 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-9">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {word.word}
          </h1>

          <button
            type="button"
            onClick={playAudio}
            disabled={!word.audioUrl || isLoadingAudio}
            className="rounded-full bg-violet-50 p-2 text-violet-600 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Play ${word.word} pronunciation`}
            title={word.audioUrl ? "Play pronunciation" : "Audio unavailable"}
          >
            {isLoadingAudio ? (
              <FiLoader className="animate-spin" size={19} />
            ) : (
              <FiVolume2
                size={19}
                className={isPlaying ? "animate-pulse" : ""}
              />
            )}
          </button>
        </div>

        {word.ipa && (
          <p className="mt-2 text-sm text-zinc-400">{word.ipa}</p>
        )}

        {sense ? (
          <>
            <span className="mt-6 inline-block rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
              {sense.partOfSpeech}
            </span>

            <h2 className="mt-4 text-lg font-semibold text-zinc-900">
              {sense.meaningEn}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {sense.meaningBn}
            </p>

            {example && (
              <div className="mt-6 rounded-xl bg-violet-50 p-4">
                <p className="text-xs font-semibold text-violet-700">
                  EXAMPLE
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-800">
                  {example.sentence}
                </p>
              </div>
            )}

            {sense.collocations.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-zinc-500">
                  COMMON COLLOCATIONS
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {sense.collocations.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-5 text-sm text-zinc-600">
              <strong>Synonyms:</strong> {sense.synonyms.join(", ")}
            </p>
          </>
        ) : (
          <p className="mt-6 text-sm text-amber-700">
            No meaning has been added for this word yet.
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          disabled={index === 0}
          onClick={() => goToWord(index - 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm disabled:opacity-40"
        >
          <FiArrowLeft /> Previous
        </button>

        {index + 1 === groupEnd ? (
          <button
            onClick={() => {
              if (index + 1 === words.length) {
                stopAudio();
                onComplete();
              } else {
                goToWord(index + 1);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
          >
            {index + 1 === words.length ? "Finish learning" : "Next group"}
            <FiArrowRight />
          </button>
        ) : (
          <button
            onClick={() => goToWord(index + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Next word <FiArrowRight />
          </button>
        )}
      </div>
    </div>
  );
}
