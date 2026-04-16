/**
 * Property Tests for Action Node Visual Distinction
 * 
 * **Feature: action-nodes, Property 9: Action Node Visual Distinction**
 * *For any* action node type, the visual styling SHALL be distinct from LLM agents
 * and each action node type SHALL have a unique color and icon.
 * **Validates: Requirements 12.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  ACTION_NODE_COLORS, 
  ACTION_NODE_ICONS, 
  ACTION_NODE_LABELS 
} from './ActionNodeBase';
import { ACTION_NODE_TYPES, type ActionNodeType } from '../../types/actionNodes';

// ============================================
// Constants for Comparison
// ============================================

/**
 * LLM Agent colors from the existing node system.
 * Action nodes must be visually distinct from these.
 */
const LLM_AGENT_COLORS = {
  agent: '#3182CE',      // Blue
  sequential: '#805AD5', // Purple
  loop: '#D69E2E',       // Yellow/Gold
  parallel: '#38A169',   // Green
  router: '#DD6B20',     // Orange
};

// ============================================
// Arbitraries (Generators)
// ============================================

/**
 * Generator for valid action node types.
 */
const arbActionNodeType: fc.Arbitrary<ActionNodeType> = fc.constantFrom(
  ...ACTION_NODE_TYPES
);

/**
 * Generator for pairs of different action node types.
 */
const arbActionNodeTypePair: fc.Arbitrary<[ActionNodeType, ActionNodeType]> = fc
  .tuple(arbActionNodeType, arbActionNodeType)
  .filter(([a, b]) => a !== b);

// ============================================
// Property Tests
// ============================================

describe('ActionNodeBase', () => {
  describe('Property 9: Action Node Visual Distinction', () => {
    /**
     * **Property 9.1: All Action Node Types Have Colors**
     * *For any* action node type, there SHALL be a defined color.
     */
    it('should have a color defined for every action node type', () => {
      fc.assert(
        fc.property(arbActionNodeType, (type) => {
          const color = ACTION_NODE_COLORS[type];
          expect(color).toBeDefined();
          expect(typeof color).toBe('string');
          expect(color.length).toBeGreaterThan(0);
          // Color should be a valid hex color
          expect(/^#[0-9A-Fa-f]{6}$/.test(color)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 9.2: All Action Node Types Have Icons**
     * *For any* action node type, there SHALL be a defined icon.
     */
    it('should have an icon defined for every action node type', () => {
      fc.assert(
        fc.property(arbActionNodeType, (type) => {
          const icon = ACTION_NODE_ICONS[type];
          expect(icon).toBeDefined();
          expect(typeof icon).toBe('string');
          expect(icon.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 9.3: All Action Node Types Have Labels**
     * *For any* action node type, there SHALL be a defined display label.
     */
    it('should have a label defined for every action node type', () => {
      fc.assert(
        fc.property(arbActionNodeType, (type) => {
          const label = ACTION_NODE_LABELS[type];
          expect(label).toBeDefined();
          expect(typeof label).toBe('string');
          expect(label.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 9.4: Unique Colors for Different Action Node Types**
     * *For any* two different action node types, their colors SHALL be different.
     */
    it('should have unique colors for different action node types', () => {
      fc.assert(
        fc.property(arbActionNodeTypePair, ([type1, type2]) => {
          const color1 = ACTION_NODE_COLORS[type1];
          const color2 = ACTION_NODE_COLORS[type2];
          expect(color1).not.toBe(color2);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 9.5: Unique Icons for Different Action Node Types**
     * *For any* two different action node types, their icons SHALL be different.
     */
    it('should have unique icons for different action node types', () => {
      fc.assert(
        fc.property(arbActionNodeTypePair, ([type1, type2]) => {
          const icon1 = ACTION_NODE_ICONS[type1];
          const icon2 = ACTION_NODE_ICONS[type2];
          expect(icon1).not.toBe(icon2);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 9.6: Action Node Colors Distinct from LLM Agent Colors**
     * *For any* action node type, its color SHALL be different from all LLM agent colors.
     * This ensures visual distinction between action nodes and LLM agents.
     */
    it('should have colors distinct from LLM agent colors', () => {
      const llmColors = Object.values(LLM_AGENT_COLORS);
      
      fc.assert(
        fc.property(arbActionNodeType, (type) => {
          const actionColor = ACTION_NODE_COLORS[type];
          // Action node color should not match any LLM agent color
          expect(llmColors).not.toContain(actionColor);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 9.7: Complete Coverage of Action Node Types**
     * The ACTION_NODE_COLORS, ACTION_NODE_ICONS, and ACTION_NODE_LABELS
     * SHALL cover all 14 action node types.
     */
    it('should cover all 14 action node types', () => {
      expect(ACTION_NODE_TYPES.length).toBe(14);
      expect(Object.keys(ACTION_NODE_COLORS).length).toBe(14);
      expect(Object.keys(ACTION_NODE_ICONS).length).toBe(14);
      expect(Object.keys(ACTION_NODE_LABELS).length).toBe(14);
      
      // Verify all types are covered
      for (const type of ACTION_NODE_TYPES) {
        expect(ACTION_NODE_COLORS[type]).toBeDefined();
        expect(ACTION_NODE_ICONS[type]).toBeDefined();
        expect(ACTION_NODE_LABELS[type]).toBeDefined();
      }
    });
  });

  describe('Color Format Validation', () => {
    /**
     * All colors should be valid 6-digit hex colors.
     */
    it('should have valid hex color format for all action node types', () => {
      for (const [, color] of Object.entries(ACTION_NODE_COLORS)) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('Icon Validation', () => {
    /**
     * All icons should be emoji characters (non-empty strings).
     */
    it('should have non-empty icon strings for all action node types', () => {
      for (const [, icon] of Object.entries(ACTION_NODE_ICONS)) {
        expect(icon.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Label Validation', () => {
    /**
     * All labels should be properly capitalized display names.
     */
    it('should have properly formatted labels for all action node types', () => {
      for (const [, label] of Object.entries(ACTION_NODE_LABELS)) {
        // Label should start with uppercase letter
        expect(label[0]).toBe(label[0].toUpperCase());
        // Label should not be empty
        expect(label.length).toBeGreaterThan(0);
      }
    });
  });
});
