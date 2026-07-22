/**
 * DictaFlow — Player Controls Component
 */

import { h, formatTime } from '../utils/helpers.js';
import { audioManager } from '../core/audioManager.js';

/**
 * Render the audio player controls bar.
 * @param {Object} options
 * @param {number} [options.startTime] - Sentence start time
 * @param {number} [options.endTime] - Sentence end time
 * @param {number} [options.repeatCount] - Repeat count setting
 * @param {Function} [options.onSentenceEnd] - Callback when sentence playback ends
 * @returns {HTMLElement}
 */
export function renderPlayerControls(options = {}) {
  const speed = audioManager.getSpeed();

  const bar = h('div', { className: 'player-bar animate-fade-in', id: 'player-bar' },
    // Play/Pause button
    h('button', {
      className: `player-btn ${audioManager.isPlaying() ? 'playing' : ''}`,
      id: 'play-btn',
      onClick: () => {
        if (options.startTime !== undefined && options.endTime !== undefined) {
          audioManager.playSentence(
            options.startTime,
            options.endTime,
            options.repeatCount || 0,
          );
          updatePlayButton(true);
        } else {
          const playing = audioManager.togglePlay();
          updatePlayButton(playing);
        }
      },
    }, audioManager.isPlaying() ? '⏸' : '▶'),

    // Progress bar
    h('div', {
      className: 'player-progress',
      id: 'player-progress',
      onClick: (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const duration = audioManager.getDuration();
        audioManager.seek(ratio * duration);
      },
    },
      h('div', { className: 'player-progress-fill', id: 'progress-fill', style: { width: '0%' } }),
    ),

    // Time display
    h('span', { className: 'player-time', id: 'player-time' }, '0:00'),

    // Speed control
    h('button', {
      className: 'player-speed',
      id: 'speed-btn',
      onClick: () => {
        const newSpeed = audioManager.cycleSpeed();
        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) speedBtn.textContent = `${newSpeed}x`;
      },
    }, `${speed}x`),

    // Replay sentence button
    options.startTime !== undefined
      ? h('button', {
          className: 'player-speed',
          onClick: () => {
            audioManager.playSentence(
              options.startTime,
              options.endTime,
              options.repeatCount || 0,
            );
            updatePlayButton(true);
          },
          title: 'Nghe lại câu này',
        }, '🔁')
      : null,
  );

  // Setup time update handler
  audioManager.onTimeUpdate((currentTime, duration) => {
    const fill = document.getElementById('progress-fill');
    const timeEl = document.getElementById('player-time');

    if (fill && duration) {
      let progress;
      if (options.startTime !== undefined && options.endTime !== undefined) {
        // Sentence-level progress
        const sentenceDuration = options.endTime - options.startTime;
        progress = ((currentTime - options.startTime) / sentenceDuration) * 100;
        progress = Math.max(0, Math.min(100, progress));
      } else {
        progress = (currentTime / duration) * 100;
      }
      fill.style.width = `${progress}%`;
    }

    if (timeEl) {
      timeEl.textContent = formatTime(currentTime);
    }
  });

  audioManager.onEnded(() => {
    updatePlayButton(false);
    options.onSentenceEnd?.();
  });

  return bar;
}

function updatePlayButton(playing) {
  const btn = document.getElementById('play-btn');
  if (btn) {
    btn.textContent = playing ? '⏸' : '▶';
    btn.className = `player-btn ${playing ? 'playing' : ''}`;
  }
}
