FROM python:3.6.8-slim-stretch

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
COPY tree_data/* /usr/tree_data/
RUN chmod +x /usr/tree_data/main.py
ENTRYPOINT ["python", "/usr/tree_data/main.py" ]