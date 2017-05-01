/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'invariant';
import SimpleTextBuffer, {Range} from 'simple-text-buffer';
import {JAVASCRIPT_WORD_REGEX} from '../pkg/nuclide-flow-common';

/**
 * Returns the text and range for the word that contains the given position.
 */

type WordTextAndRange = {text: string, range: Range};

export default function getWordTextAndRange(
  buffer: SimpleTextBuffer,
  position: atom$Point,
  wordRegExp?: ?RegExp = JAVASCRIPT_WORD_REGEX,
): WordTextAndRange {
  invariant(wordRegExp != null, 'requires wordRegExp');
  let textAndRange: ?WordTextAndRange = null;

  buffer.scanInRange(wordRegExp, buffer.rangeForRow(position.row), data => {
    if (data.range.containsPoint(position)) {
      textAndRange = {
        text: data.matchText,
        range: data.range,
      };
      data.stop();
    } else if (data.range.end.column > position.column) {
      // Stop the scan if the scanner has passed our position.
      data.stop();
    }
  });

  if (!textAndRange) {
    textAndRange = {text: '', range: new Range(position, position)};
  }

  return textAndRange;
}
