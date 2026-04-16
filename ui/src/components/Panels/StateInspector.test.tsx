/**
 * StateInspector Component Tests
 * 
 * Tests for the runtime state inspector utility functions.
 * 
 * Requirements: 4.8 - Changed keys highlighting
 */

import { describe, it, expect } from 'vitest';
import { getChangedKeys } from './StateInspector';

describe('getChangedKeys', () => {
  it('should return empty set when both states are undefined', () => {
    const result = getChangedKeys(undefined, undefined);
    expect(result.size).toBe(0);
  });

  it('should return empty set when previous state is undefined', () => {
    const curr = { a: 1 };
    const result = getChangedKeys(undefined, curr);
    expect(result.size).toBe(0);
  });

  it('should return empty set when current state is undefined', () => {
    const prev = { a: 1 };
    const result = getChangedKeys(prev, undefined);
    expect(result.size).toBe(0);
  });

  it('should return empty set when states are identical', () => {
    const state = { a: 1, b: 'test' };
    const result = getChangedKeys(state, { ...state });
    expect(result.size).toBe(0);
  });

  it('should detect new keys', () => {
    const prev = { a: 1 };
    const curr = { a: 1, b: 2 };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('b')).toBe(true);
    expect(result.has('a')).toBe(false);
  });

  it('should detect removed keys', () => {
    const prev = { a: 1, b: 2 };
    const curr = { a: 1 };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('b')).toBe(true);
    expect(result.has('a')).toBe(false);
  });

  it('should detect changed string values', () => {
    const prev = { a: 1, b: 'old' };
    const curr = { a: 1, b: 'new' };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('b')).toBe(true);
    expect(result.has('a')).toBe(false);
  });

  it('should detect changed number values', () => {
    const prev = { count: 5 };
    const curr = { count: 10 };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('count')).toBe(true);
  });

  it('should detect changed boolean values', () => {
    const prev = { active: true };
    const curr = { active: false };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('active')).toBe(true);
  });

  it('should detect changes in nested objects', () => {
    const prev = { a: { nested: 1 } };
    const curr = { a: { nested: 2 } };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('a')).toBe(true);
  });

  it('should not flag unchanged nested objects', () => {
    const prev = { a: { nested: 1 } };
    const curr = { a: { nested: 1 } };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('a')).toBe(false);
  });

  it('should detect changes in arrays', () => {
    const prev = { items: [1, 2, 3] };
    const curr = { items: [1, 2, 4] };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('items')).toBe(true);
  });

  it('should not flag unchanged arrays', () => {
    const prev = { items: [1, 2, 3] };
    const curr = { items: [1, 2, 3] };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('items')).toBe(false);
  });

  it('should detect array length changes', () => {
    const prev = { items: [1, 2] };
    const curr = { items: [1, 2, 3] };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('items')).toBe(true);
  });

  it('should detect null to value changes', () => {
    const prev = { value: null };
    const curr = { value: 'something' };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('value')).toBe(true);
  });

  it('should detect value to null changes', () => {
    const prev = { value: 'something' };
    const curr = { value: null };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('value')).toBe(true);
  });

  it('should handle multiple changed keys', () => {
    const prev = { a: 1, b: 2, c: 3 };
    const curr = { a: 10, b: 2, c: 30 };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(false);
    expect(result.has('c')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('should handle empty objects', () => {
    const prev = {};
    const curr = {};
    const result = getChangedKeys(prev, curr);
    
    expect(result.size).toBe(0);
  });

  it('should detect all keys as new when previous is empty', () => {
    const prev = {};
    const curr = { a: 1, b: 2 };
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('should detect all keys as removed when current is empty', () => {
    const prev = { a: 1, b: 2 };
    const curr = {};
    const result = getChangedKeys(prev, curr);
    
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(true);
    expect(result.size).toBe(2);
  });
});
