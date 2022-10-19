#!/usr/bin/env bash

name="manimaul/webrtc:latest"
docker build -t "$name" .
docker push "$name"
