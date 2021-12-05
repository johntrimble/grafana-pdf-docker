# Grafana PDF Docker

This projects makes a docker image out of someone else's nifty node script (see [kartik468/grafana-generate-pdf-nodejs](https://github.com/kartik468/grafana-generate-pdf-nodejs) and [svet-b/1ad0656cd3ce0e1a633e16eb20f6642](https://gist.github.com/svet-b/1ad0656cd3ce0e1a633e16eb20f66425)) for generating PDFs of Grafana dashboards by closely following another person's [example](https://www.cloudsavvyit.com/13461/how-to-run-puppeteer-and-headless-chrome-in-a-docker-container/) of how to build a docker image for puppeteer.

## Quick Start

Exporting a dashboard:


```
docker run \
    --mount type=bind,source="$PWD",target=/output \
    --rm \
    --tty \
    --interactive \
    ghcr.io/johntrimble/grafana-pdf-docker:main \
    --user admin \
    --password ncCsmnK213Ngvfd50uEv \
    --output /output/test.pdf \
    'http://grafana.example.com/d/e1LER1Pef/my-dashboard?orgId=1&from=1638556236100&to=1638566616683'
```

Using environment variables:

```
docker run \
    --env GF_OUTPUT=/output/test.pdf \
    --env GF_URL='http://grafana.example.com/d/e1LER1Pef/my-dashboard?orgId=1&from=1638556236100&to=1638566616683' \
    --env GF_USERNAME=admin \
    --env GF_PASSWORD=ncCsmnK213Ngvfd50uEv \
    --mount type=bind,source="$PWD",target=/output \
    --rm \
    --tty \
    --interactive \
    ghcr.io/johntrimble/grafana-pdf-docker:main
```

From a Grafana instance running on the host (localhost:3000):

```
docker run \
    --mount type=bind,source="$PWD",target=/output \
    --add-host=host.docker.internal:host-gateway \
    --rm \
    --tty \
    --interactive \
    ghcr.io/johntrimble/grafana-pdf-docker:main \
    --user admin \
    --password ncCsmnK213Ngvfd50uEv \
    --output /output/test.pdf \
    'http://host.docker.internal:3000/d/e1LER1Pef/my-dashboard?orgId=1&from=1638556236100&to=1638566616683'
```

Using an API token:

```
docker run \
    --mount type=bind,source="$PWD",target=/output \
    --rm \
    --tty \
    --interactive \
    ghcr.io/johntrimble/grafana-pdf-docker:main \
    --api-token 1JZJLUqQBJNof5ZqWxdU \
    --output /output/test.pdf \
    'http://grafana.example.com/d/e1LER1Pef/my-dashboard?orgId=1&from=1638556236100&to=1638566616683'
```