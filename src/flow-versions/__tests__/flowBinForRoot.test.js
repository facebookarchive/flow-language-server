// @flow

import path from 'path';
import {flowBinForPath, _flowSemverForRootPath} from '../flowBinForRoot';

const noop = () => {};

describe('flowBinForRoot', () => {
  describe('flowSemverForPath', () => {
    it('returns the flowconfig\'s version without a message when only a flowconfig is present', async () => {
      const mockReporter = {
        info: jest.fn(),
        error: noop,
        warn: noop,
      };

      const resolved = await _flowSemverForRootPath(
        path.join(__dirname, 'fixtures', 'only-flowconfig'),
        mockReporter,
      );
      expect(resolved).toBe('0.47.0');
      expect(mockReporter.info).not.toHaveBeenCalled();
    });

    it('returns the package.json\'s version without a message when only the package.json version is present', async () => {
      const mockReporter = {
        info: jest.fn(),
        error: noop,
        warn: noop,
      };

      const resolved = await _flowSemverForRootPath(
        path.join(__dirname, 'fixtures', 'only-packagejson'),
        mockReporter,
      );
      expect(resolved).toBe('^0.47.0');
      expect(mockReporter.info).not.toHaveBeenCalled();
    });


    it('returns the flowconfig\'s version with a message when both flowconfig and package.json dependency are present', async () => {
      const mockReporter = {
        info: jest.fn(),
        error: noop,
        warn: noop,
      };

      const resolved = await _flowSemverForRootPath(
        path.join(__dirname, 'fixtures', 'flowconfig-and-packagejson'),
        mockReporter,
      );
      expect(resolved).toBe('0.47.0');
      expect(mockReporter.info).toHaveBeenCalled();
    });

    it('returns null (indicating to download latest) when no version is present, and warns the user', async () => {
      const mockReporter = {
        info: noop,
        error: noop,
        warn: jest.fn(),
      };

      const resolved = await _flowSemverForRootPath(
        path.join(__dirname, 'fixtures', 'no-versions'),
        mockReporter,
      );
      expect(resolved).toBe(null);
      expect(mockReporter.warn).toHaveBeenCalled();
    });
  });
});
