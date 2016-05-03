# Crate

A 2D in-browser multiplayer shooter

## About

The purpose of this game is to provide the intensity and thrill of popular FFA shooters in a simple 2D form.
And the best part is - it requires no installation, simply connect and play.

## Prerequisities

Recent versions of ```Typescript```, ```Nodejs``` and ```Gulp``` are required to build and run the project.
Other minor build dependencies can be found in the gulpfile.

## Installation and deployment

After acquiring all prerequisites you need to build the project by running.

```
gulp install
```

This compiles and minifies all typescript/javascript files and populates the build and publish directories.
For debug deliverables simply run ```gulp install-debug```.

For the sake of saving time modules and resources can be built and packaged separately.
See the gulpfile for more details on individual tasks.

To run the game first set the CRATE_PATH environment variable to the ```build``` directory of the project.
Then all you need to do is run the server file on Node and connect, default port is 8080.

## Built With

* Typescript (client-side) and Nodejs (server-side)
* Gulp

## Authors

spacegospod

## License

This project is licensed under the ISP License - see the [LICENSE.md](LICENSE.md) file for details.
