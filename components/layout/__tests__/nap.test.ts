// @vitest-environment node

/**
 * NAP String Consistency Tests
 *
 * Property 9: NAP string is identical across all three page contexts
 * Validates: Requirements 5.3, 6.6
 *
 * The canonical NAP string must be byte-for-byte identical wherever it appears
 * (Footer, About page, Contact page). Since About and Contact pages don't exist
 * yet, we assert the contract via the exported NAP_STRING constant from Footer.tsx.
 */

import { NAP_STRING } from '../Footer';

const EXPECTED_NAP_STRING =
  'LN Boys PG & Hostel, Vidhani (JECRC), Jaipur, Rajasthan, +91 83858 57902';

describe('NAP String Consistency (Property 9)', () => {
  describe('Export contract', () => {
    it('exports NAP_STRING as a named string constant from Footer.tsx', () => {
      expect(typeof NAP_STRING).toBe('string');
    });

    it('NAP_STRING is not empty', () => {
      expect(NAP_STRING.length).toBeGreaterThan(0);
    });
  });

  describe('Byte-for-byte equality', () => {
    it('NAP_STRING is byte-for-byte identical to the expected canonical string', () => {
      // This is the core Property 9 assertion — any accidental edit to NAP_STRING
      // in Footer.tsx will immediately fail this test.
      expect(NAP_STRING).toBe(EXPECTED_NAP_STRING);
    });

    it('NAP_STRING has the correct byte length', () => {
      const expectedBytes = Buffer.byteLength(EXPECTED_NAP_STRING, 'utf8');
      const actualBytes = Buffer.byteLength(NAP_STRING, 'utf8');
      expect(actualBytes).toBe(expectedBytes);
    });
  });

  describe('Canonical form — no whitespace anomalies', () => {
    it('has no leading whitespace', () => {
      expect(NAP_STRING).toBe(NAP_STRING.trimStart());
    });

    it('has no trailing whitespace', () => {
      expect(NAP_STRING).toBe(NAP_STRING.trimEnd());
    });

    it('has no consecutive double spaces', () => {
      expect(NAP_STRING).not.toMatch(/  /);
    });
  });

  describe('Contains all required NAP parts', () => {
    it('contains the business name "LN Boys PG & Hostel"', () => {
      expect(NAP_STRING).toContain('LN Boys PG & Hostel');
    });

    it('contains the locality "Vidhani (JECRC)"', () => {
      expect(NAP_STRING).toContain('Vidhani (JECRC)');
    });

    it('contains the city "Jaipur"', () => {
      expect(NAP_STRING).toContain('Jaipur');
    });

    it('contains the state "Rajasthan"', () => {
      expect(NAP_STRING).toContain('Rajasthan');
    });

    it('contains the phone number "+91 83858 57902"', () => {
      expect(NAP_STRING).toContain('+91 83858 57902');
    });
  });
});
