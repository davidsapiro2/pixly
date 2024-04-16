
from flask import Flask, render_template

app = Flask(__name__)
app.config['SECRET_KEY'] = "oh-so-secret"

@app.get("/")
def homepage():
    """Returns homepage"""

    return render_template("index.html")