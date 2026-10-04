# QFlux

QFlux is a React and Three.js quantum circuit lab backed by FastAPI and NumPy. The old root MVP has been removed; V2 is now the single frontend implementation.

## Included

- H, X, Y, Z, S, T and CNOT gates
- Bell, superposition, and GHZ templates
- 3-qubit state-vector simulation
- Measurement histogram and amplitude inspector
- React + Vite frontend
- Three.js Bloch-sphere rendering

## V2 preview

The V2 implementation lives in `v2/` and uses React, Vite, Three.js, FastAPI, and NumPy.

```powershell
cd v2/backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

In a second terminal, install and run the React frontend:

```powershell
cd v2/frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://127.0.0.1:5173`. The frontend connects to the local FastAPI engine and includes circuit editing, Bell/GHZ templates, exact amplitudes, seeded measurement, and Python/Qiskit algorithm verification.

Run the algorithm regression suite from `v2/backend`:

```powershell
python -m pip install -r requirements.txt
python -m pytest -q
```

The suite validates Bell, GHZ, uniform superposition, and two-qubit Grover circuits against exact NumPy probabilities.

For independent Qiskit cross-validation:

```powershell
python -m pip install -r requirements-qiskit.txt
```

The V2 panel reports the installed Qiskit version and cross-check count. Qiskit is development-only; the production engine remains NumPy-based.

## Render backend deployment

For a Render Web Service, use these settings:

```text
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

The repository includes a root `backend/` compatibility entry point. It forwards to the tested engine in `v2/backend`, so the existing Render service setting `backend` is supported.

Vercel uses the root `requirements.txt`, which intentionally allows Python 3.14-compatible FastAPI, NumPy, and Pydantic versions. Render uses the pinned dependencies in `backend/requirements.txt` with its Python 3 service runtime.

## Vercel deployment

This repository is configured as one Vercel project:

- Frontend build: `v2/frontend`
- Output: `v2/frontend/dist`
- FastAPI serverless entry: `api/index.py`
- API URL in production: `/api`

Import the repository into Vercel with the project root left at the repository root. The committed `vercel.json` supplies the build and `/api/*` rewrite. No `VITE_API_URL` variable is required for same-project deployment. For a separately hosted backend, set `VITE_API_URL` to its public URL and redeploy.