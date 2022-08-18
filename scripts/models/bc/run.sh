#!/bin/bash
cat test.bc | bc -l state.bc irm.bc exponential.bc mint.bc
