#!/bin/bash
cat test.bc | bc -l state.bc doaccrueinterest.bc irm.bc exponential.bc mint.bc
