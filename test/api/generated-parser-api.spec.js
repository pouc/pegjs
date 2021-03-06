"use strict";

/* global console */

let chai = require("chai");
let peg = require("../../lib/peg");
let sinon = require("sinon");

let expect = chai.expect;

describe("generated parser API", function() {
  describe("parse", function() {
    it("parses input", function() {
      let parser = peg.generate("start = 'a'");

      expect(parser.parse("a")).to.equal("a");
    });

    it("throws an exception on syntax error", function() {
      let parser = peg.generate("start = 'a'");

      expect(() => { parser.parse("b"); }).to.throw();
    });

    describe("start rule", function() {
      let parser = peg.generate([
        "a = 'x' { return 'a'; }",
        "b = 'x' { return 'b'; }",
        "c = 'x' { return 'c'; }"
      ].join("\n"), { allowedStartRules: ["b", "c"] });

      describe("when |startRule| is not set", function() {
        it("starts parsing from the first allowed rule", function() {
          expect(parser.parse("x")).to.equal("b");
        });
      });

      describe("when |startRule| is set to an allowed rule", function() {
        it("starts parsing from specified rule", function() {
          expect(parser.parse("x", { startRule: "b" })).to.equal("b");
          expect(parser.parse("x", { startRule: "c" })).to.equal("c");
        });
      });

      describe("when |startRule| is set to a disallowed start rule", function() {
        it("throws an exception", function() {
          expect(() => { parser.parse("x", { startRule: "a" }); }).to.throw();
        });
      });
    });

    describe("tracing", function() {
      let parser = peg.generate([
        "start = a / b",
        "a = 'a'",
        "b = 'b'"
      ].join("\n"), { trace: true });

      describe("default tracer", function() {
        it("traces using console.log (if console is defined)", function() {
          if (typeof console === "object") {
            sinon.stub(console, "log");
          }

          try {
            parser.parse("b");

            if (typeof console === "object") {
              expect(console.log.calledWithExactly("1:1-1:1 rule.enter start")).to.equal(true);
              expect(console.log.calledWithExactly("1:1-1:1 rule.enter   a")).to.equal(true);
              expect(console.log.calledWithExactly("1:1-1:1 rule.fail    a")).to.equal(true);
              expect(console.log.calledWithExactly("1:1-1:1 rule.enter   b")).to.equal(true);
              expect(console.log.calledWithExactly("1:1-1:2 rule.match   b")).to.equal(true);
              expect(console.log.calledWithExactly("1:1-1:2 rule.match start")).to.equal(true);
            }
          } finally {
            if (typeof console === "object") {
              console.log.restore();
            }
          }
        });
      });

      describe("custom tracers", function() {
        describe("trace", function() {
          it("receives tracing events", function() {
            let tracer = { trace: sinon.spy() };

            parser.parse("b", { tracer: tracer });

            expect(tracer.trace.calledWithExactly({
              type: "rule.enter",
              rule: "start",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 0, line: 1, column: 1 }
              }
            })).to.equal(true);
            expect(tracer.trace.calledWithExactly({
              type: "rule.enter",
              rule: "a",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 0, line: 1, column: 1 }
              }
            })).to.equal(true);
            expect(tracer.trace.calledWithExactly({
              type: "rule.fail",
              rule: "a",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 0, line: 1, column: 1 }
              }
            })).to.equal(true);
            expect(tracer.trace.calledWithExactly({
              type: "rule.enter",
              rule: "b",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 0, line: 1, column: 1 }
              }
            })).to.equal(true);
            expect(tracer.trace.calledWithExactly({
              type: "rule.match",
              rule: "b",
              result: "b",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 1, line: 1, column: 2 }
              }
            })).to.equal(true);
            expect(tracer.trace.calledWithExactly({
              type: "rule.match",
              rule: "start",
              result: "b",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 1, line: 1, column: 2 }
              }
            })).to.equal(true);
          });
        });
      });
    });

    it("accepts custom options", function() {
      let parser = peg.generate("start = 'a'");

      parser.parse("a", { foo: 42 });
    });
  });
});
