# Fitness demonstration fixture

`fitness-demo.mp4` is an original generated moving test pattern, not an exercise demonstration.
It has no audio, household data or external media. Generation command (ffmpeg is only a developer
fixture tool; it is not a Hearth runtime dependency):

```sh
ffmpeg -f lavfi -i testsrc2=size=320x180:rate=12 -t 3 -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart fitness-demo.mp4
```

Used to test real decoding, authenticated ranges, upload limits/retries and remote playback.
