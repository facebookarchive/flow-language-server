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

import type {TypeHint} from '../../nuclide-type-hint/lib/rpc-types';

export function typeHintFromSnippet(
  snippet: string,
  range: atom$Range,
): TypeHint {
  return {hint: [{type: 'snippet', value: snippet}], range};
}
