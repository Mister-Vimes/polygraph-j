import {describe, expect, test} from '@jest/globals';
import PieGraph from './polygraph-j-class';

let polygonA = {
    layers: 4,
    points:[],
    color: {
        r: 180,
        g: 80,
        b: 20,
    },
    blend: 50,
};

let polygonB = {
    layers: 1,
    points: [],
    color: {
        r: 0,
        g: 0,
        b: 255,
    },
    blend: 50,
};

describe('Colors blend...', () => {
    test('at total depth of 5', () => {
        expect(PieGraph.prototype.findNewColor(polygonA, polygonB)).toEqual({
            r: 144,
            g: 64,
            b: 67,
        });
    });
});

describe('Input sanitization, non-numeric:', () => {
    test('No change, alphabet', () => {
        expect(PieGraph.prototype.sanitize('Party', false)).toBe('Party');
    });
    test('No change, alphabet plus numbers', () => {
        expect(PieGraph.prototype.sanitize('Party334', false)).toBe('Party334');
    });
    test('Trim whitespace', () => {
        expect(PieGraph.prototype.sanitize('   Party334   ', false)).toBe('Party334');
    });
    test('Include special chars', () => {
        expect(PieGraph.prototype.sanitize('Party\'@%&', false)).toBe('Party\'@%&');
    });
    test('Include special chars', () => {
        expect(PieGraph.prototype.sanitize('Party$.-/!#', false)).toBe('Party$.-/!#');
    });
    test('Eliminate garbage chars', () => {
        expect(PieGraph.prototype.sanitize('Party^*()_|=+`~?,<>[]{}', false)).toBe('Party');
    });    
    test('Real language', () => {
        expect(PieGraph.prototype.sanitize('Milo & Otis', false)).toBe('Milo & Otis');
    });    
    test('Real language', () => {
        expect(PieGraph.prototype.sanitize('Don\'t @ me, bro!', false)).toBe('Don\'t @ me bro!');
    });     
});

describe('Input sanitization, numeric:', () => {
    test('No change', () => {
        expect(PieGraph.prototype.sanitize('7337', true)).toBe('7337');
    });
    test('Trim whitespace', () => {
        expect(PieGraph.prototype.sanitize('73 37  ', true)).toBe('7337');
    });
    test('Filter letters', () => {
        expect(PieGraph.prototype.sanitize('73fg37gg', true)).toBe('7337');
    });   
    test('Filter specials', () => {
        expect(PieGraph.prototype.sanitize('7,337^^', true)).toBe('7337');
    });
    test('decimal', () => {
        expect(PieGraph.prototype.sanitize('733.7', true)).toBe('733.7');
    });     
    test('too many decimals', () => {
        expect(PieGraph.prototype.sanitize('7.3.3.7', true)).toBe('7.337');
    });      
});

describe('Input sanitization, numeric plus range:', () => {
    test('No change', () => {
        expect(PieGraph.prototype.sanitize('3', true, [0, 100])).toBe('3');
    });
    test('Too big', () => {
        expect(PieGraph.prototype.sanitize('500', true, [0, 100])).toBe('100');
    });
    test('Too small plus decimal', () => {
        expect(PieGraph.prototype.sanitize('.1', true, [5, 100])).toBe('5');
    });   
    test('Too small, one parameter', () => {
        expect(PieGraph.prototype.sanitize('.1', true, [5])).toBe('5');
    });   
});