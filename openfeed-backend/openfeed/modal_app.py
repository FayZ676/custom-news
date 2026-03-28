import modal

app = modal.App("openfeed-api")

image = modal.Image.from_dockerfile("Dockerfile").add_local_python_source("openfeed")


@app.function(image=image, secrets=[modal.Secret.from_name("openfeed-secrets")])
@modal.asgi_app()
def fastapi_app():
    from openfeed.main import app as openfeed_app

    return openfeed_app
