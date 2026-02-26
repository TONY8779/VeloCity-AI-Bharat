import { useState, useCallback, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FFMPEG_FILTERS } from '../utils/constants';

export const useFFmpeg = () => {
  const ffmpegRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress: p }) => setProgress(Math.round(p * 100)));
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegRef.current = ffmpeg;
      setLoaded(true);
    } catch (err) {
      console.error('FFmpeg load error:', err);
    }
    setLoading(false);
  }, [loaded, loading]);

  const trimVideo = useCallback(async (inputFile, startTime, endTime) => {
    if (!ffmpegRef.current) return null;
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
    await ffmpeg.exec(['-i', 'input.mp4', '-ss', String(startTime), '-to', String(endTime), '-c', 'copy', 'output.mp4']);
    const data = await ffmpeg.readFile('output.mp4');
    return new Blob([data.buffer], { type: 'video/mp4' });
  }, []);

  const applyFilter = useCallback(async (inputFile, filterName) => {
    if (!ffmpegRef.current) return null;
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
    const vf = FFMPEG_FILTERS[filterName];
    if (!vf) return null;
    await ffmpeg.exec(['-i', 'input.mp4', '-vf', vf, '-c:a', 'copy', 'filtered.mp4']);
    const data = await ffmpeg.readFile('filtered.mp4');
    return new Blob([data.buffer], { type: 'video/mp4' });
  }, []);

  const exportVideo = useCallback(async (inputFile, options = {}) => {
    if (!ffmpegRef.current) return null;
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
    const args = ['-i', 'input.mp4'];

    if (options.trim) {
      args.push('-ss', String(options.trim.start), '-to', String(options.trim.end));
    }

    const vfFilters = [];

    if (options.filter && FFMPEG_FILTERS[options.filter]) {
      vfFilters.push(FFMPEG_FILTERS[options.filter]);
    }

    if (options.resolution) {
      const resMap = { '720p': 720, '1080p': 1080, '4k': 2160 };
      const h = resMap[options.resolution];
      if (h) vfFilters.push(`scale=-2:${h}`);
    }

    if (options.platform) {
      const platformCrops = {
        tiktok: 'crop=ih*9/16:ih,scale=1080:1920',
        'instagram-reel': 'crop=ih*9/16:ih,scale=1080:1920',
        'instagram-post': 'crop=min(iw\\,ih):min(iw\\,ih),scale=1080:1080',
      };
      if (platformCrops[options.platform]) {
        vfFilters.push(platformCrops[options.platform]);
      }
    }

    if (vfFilters.length > 0) {
      args.push('-vf', vfFilters.join(','));
    }

    // Format-specific output
    const format = options.format || 'mp4';
    let outputFile = `export.${format}`;

    if (format === 'webm') {
      args.push('-c:v', 'libvpx', '-c:a', 'libvorbis', outputFile);
    } else if (format === 'mov') {
      args.push('-c:a', 'copy', outputFile);
    } else {
      args.push('-c:a', 'copy', outputFile);
    }

    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputFile);
    const mimeMap = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
    return new Blob([data.buffer], { type: mimeMap[format] || 'video/mp4' });
  }, []);

  return { load, loaded, loading, progress, trimVideo, applyFilter, exportVideo };
};
