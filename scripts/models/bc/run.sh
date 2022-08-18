#!/bin/bash
cat test.bc | bc -l state.bc exponential.bc mint.bc
