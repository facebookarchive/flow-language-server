/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

import path from 'path';
import {_flowSemverForRootPath} from '../src/flowBinForRoot';

describe('flowBinForRoot', () => {
  let mockReporter;
  beforeEach(() => {
    mockReporter = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
  });

  describe('flowSemverForPath', () => {
    it("returns the flowconfig's version without a message when only a flowconfig is present", async () => {
      const resolved = await _flowSemverForRootPath(
        path.join(__dirname, 'fixtures', 'only-flowconfig'),
        mockReporter,
      );
      expect(resolved).toBe('0.47.0');
      // $FlowFixMe
      expect(mockReporter.info.mock.calls).toMatchSnapshot();
      expect(mockReporter.warn).not.toHaveBeenCalled();
    });

    it("returns the package.json's version without a message when only the package.json version is present", async () => {
      const resolved = await _flowSemverForRootPath(
        path.join(__dirname, 'fixtures', 'only-packagejson'),
        mockReporter,
      );
      expect(resolved).toBe('^0.47.0');
      // $FlowFixMe
      expect(mockReporter.info.mock.calls).toMatchSnapshot();
      expect(mockReporter.warn).not.toHaveBeenCalled();
    });

    it("returns the flowconfig's version with a message when both flowconfig and package.json dependency are present", async () => {
      const resolved = await _flowSemverForRootPath(
        path.join(__dirname, 'fixtures', 'flowconfig-and-packagejson'),
        mockReporter,
      );
      expect(resolved).toBe('0.47.0');
      // $FlowFixMe
      expect(mockReporter.info.mock.calls).toMatchSnapshot();
    });

    it('returns * (indicating to download latest) when no version is present, and warns the user', async () => {
      const resolved = await _flowSemverForRootPath(
        path.join(__dirname, 'fixtures', 'no-versions'),
        mockReporter,
      );
      expect(resolved).toBe('*');
      expect(mockReporter.warn).toHaveBeenCalled();
    });
  });
});
