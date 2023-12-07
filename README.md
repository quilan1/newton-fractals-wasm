# Newton's Method Fractal Generator

## Overview

This program is a sandbox program I've been using to test & design various functions for rendering with Newton's method and the various other
root finding algorithms.

## Setup

The only real requirement is Docker Compose. For windows, this may be found by installing Docker Desktop. Once installed, hosting the server & frontend may be done with the command (in the root directory of this repo):

> docker-compose up -d

This will take some time for the rust server to compile the project (running tests, building the final product), and for the frontend to setup.

### Usage

To access the webpage, simply navigate on your browser to:
[http://localhost:3000](http://localhost:3000).

For basic usage, choose a formula from the 'Formula:' dropdown or enter your own formula in the 'Custom:' field. Use the mouse to drag the fractal or use the mouse wheel to zoom in.

## Project Organization

The Rust crates are inside of the `crates` directory, and the Typescript files are inside the `frontend` directory. The general flow of information is as follows:

### Frontend

* [frontend](frontend): A Next.JS React project that handles all of the statistics calculations & layout of the information.

### Crates

* [newton_core](crates/newton_core/src): This is where the number crunching happens. Roots are calculated here, newton's method is iterated, etc.
* [newton_wasm](crates/newton_wasm/src): This crate provides a handy set of wrapper functions that function as a translator layer.

## Detailed Overview

Newton's Method (or Newton–Raphson's method) is a very simple calculus algorithm for finding zeroes of a function. Starting at a guess, each iteration will then yield results that are closer & closer to one of the roots of the function (where the value is zero). However, the bevhior is also chaotic in many scenarios, resulting in some pretty wild patterns when operated over the complex plane.

For more details about Newton's Method, I recommend reading [The Wiki](https://en.wikipedia.org/wiki/Newton%27s_method) and especially recommend watching 3Blue1Brown's [fantastic video on the subject](https://www.youtube.com/watch?v=-RdOwhmqP5s).

### Basic UI Usage

#### Formulas

* `Formula`: These are a number of interesting-looking functions I've found over the course of either randomly generating new functions, or exploring various classes of function (eg. generating 2-cycles). Choose a function, see the pretty picture!
* `Custom`: If you'd like to play around with making your own polynomials, put them here. Valid polynomials are those with integer coefficients and positive exponents of z value. Complex or floating coefficients, math functions, parentheses, etc. are not yet implemented. Perhaps a distant goal.
* `Random 2-Cycle`: Attempts to generate 5th degree functions with super-attracting critical points. Sometimes this works, and sometimes not. To actually determine if it is a cycle requires analysis of ~25-degree polynomials though, so by chance it is, for now.
* `Random`: Generates random coefficients for formulas. Truly YOLO generation.

#### Rendering

* `Color Scheme`: The three color schemes function as such:
  * `Contrasting Hues`: Colors are initially chosen via the `Linear Hue` scheme. Once that's done though, every other hue is interleaved to produce maximal adjacent hue differences. This yields a highly contrasting set of hues, rotationally.
  * `Linear Hue`: Every root gets a unique hue based on the root's polar angle & radius. 'Red' is at 0° (positive real axis), 'Green' at 120°, 'Blue' at 240°. The radius of the root determines the chromaticity of the root; roots closer to the origin will yield paler colors than those further away.
  * `Monochromatic`: A hue is chosen based off of the angle of the root closest to 0° in the positive direction. All other roots will use this hue for their color, however they will still have chromaticity based off of their radius.
* `Hue Offset`: With the color schemes, all roots will have an associated hue. By adjusting the hue offset, each othese hues will be shifted around the color-wheel.
* `Chromaticity`: Root colors' chromaticity will be scaled by this factor. To the left, all colors will become black & white, and to the right all colors will become super saturated. Because this operates in the LCH colorspace, this may achieve unintended results, however.
* `Shading Curve`: The lightness of each point is determined by how long it takes to reach a root; black signifies that it never reached the root. This value sets the exponential curve of the lightness dropoff, to achieve a shaded look to the colors.
* `Show Roots`: Pretty simply, draws a circle around the roots of the function. For some functions, one may need to zoom out to find them.
* `Static Hues`: Typically the hue of roots is based off of the initial polar angle. This can be troublesome if one's trying to achieve consistent color results through multiple functions. This sets all hues to be based off of zero initially. So for example, all 4th order functions (z^4) will always start with red, blue, green & yellow roots, no matter where their first root may lie. This is most useful with Monochromatic mode, adjusting hue offset across multiple functions.

### Rendering Information

Currently, the core rendering algorithm functions as follows:

* `|f(z)| < 1e-5`. This signifies that z has arrived at one of the roots of the function.
* z iterates 20 times without reaching a root. This will be drawn as a black pixel.

Because I'm using 32-bit floating point values of z for performance reasons, there will be artifacts as one zooms in further.
