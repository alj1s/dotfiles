'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

export type FileResult = any;

export type GroupedResult = {string: {string: {items: Array<FileResult>}}};

export type GroupedResultPromise = Promise<GroupedResult>;

var QuickSelectionProvider = require('./QuickSelectionProvider');
export type QuickSelectionProvider = QuickSelectionProvider;
