# 🦜 parakeet-tdt-0.6b-v3: Multilingual Speech-to-Text Model

| Model Arch | Params | Language |
| :--- | :--- | :--- |
| FastConformer-TDT | 0.6B | EU Languages |

### Description:

`parakeet-tdt-0.6b-v3` is a 600-million-parameter multilingual automatic speech recognition (ASR) model designed for high-throughput speech-to-text transcription. It extends the `parakeet-tdt-0.6b-v2` model by expanding language support from English to 25 European languages. The model automatically detects the language of the audio and transcribes it without requiring additional prompting. It is part of a series of models that leverage the Granary [1, 2] multilingual corpus as their primary training dataset.

🤗 **Try Demo here:** https://huggingface.co/spaces/nvidia/parakeet-tdt-0.6b-v3

### Supported Languages:

Bulgarian (**bg**), Croatian (**hr**), Czech (**cs**), Danish (**da**), Dutch (**nl**), English (**en**), Estonian (**et**), Finnish (**fi**), French (**fr**), German (**de**), Greek (**el**), Hungarian (**hu**), Italian (**it**), Latvian (**lv**), Lithuanian (**lt**), Maltese (**mt**), Polish (**pl**), Portuguese (**pt**), Romanian (**ro**), Slovak (**sk**), Slovenian (**sl**), Spanish (**es**), Swedish (**sv**), Russian (**ru**), Ukrainian (**uk**)

This model is ready for commercial/non-commercial use.

### Key Features:

`parakeet-tdt-0.6b-v3`'s key features are built on the foundation of its predecessor, `parakeet-tdt-0.6b-v2`, and include:

- Automatic **punctuation** and **capitalization**
- Accurate **word-level** and **segment-level** timestamps
- **Long audio** transcription, supporting audio **up to 24 minutes** long with full attention (on A100 80GB) or up to 3 hours with local attention.
- Released under a **permissive CC BY 4.0 license**

For full details on the model architecture, training methodology, datasets, and evaluation results, check out the [Technical Report](#).

### License/Terms of Use:

**GOVERNING TERMS**: Use of this model is governed by the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) license.

### Discover more from NVIDIA:

For documentation, deployment guides, enterprise-ready APIs, and the latest open models—including Nemotron and other cutting-edge speech, translation, and generative AI—visit the NVIDIA Developer Portal at [developer.nvidia.com](https://developer.nvidia.com). Join the community to access tools, support, and resources to accelerate your development with NVIDIA's NeMo, Riva, NIM, and foundation models.

### Explore more from NVIDIA:

- [What is Nemotron?](https://www.nvidia.com)
- [NVIDIA Developer Nemotron](https://developer.nvidia.com)
- [NVIDIA Riva Speech](https://developer.nvidia.com/riva)
- [NeMo Documentation](https://docs.nvidia.com/nemo-framework/)

---

## Automatic Speech Recognition (ASR) Performance

### Word Error Rate (WER) across multiple benchmarks - 24 Supported Languages ↓

| Benchmark Dataset | Parakeet-tdt-0.6b-v3 (0.6B) *(Ours)* | whisper-large-v3 (1.5B) | seamless-m4t-medium (1.2B) | seamless-m4t-v2-large (2.3B) |
| :--- | :---: | :---: | :---: | :---: |
| **Fleurs (24 Langs)** | ~11.5% | ~12.5% | ~15.8% | ~10.2% |
| **CoVoST (12 Langs)** | ~9.8% | ~9.6% | ~12.3% | ~6.0% |
| **MLS (6 Langs)** | ~7.9% | ~8.1% | ~8.2% | ~5.3% |

*Figure 1: ASR WER comparison across different models. This does not include Punctuation and Capitalisation errors.*

---

### Evaluation Notes

- **Note 1:** The above evaluations are conducted for 24 supported languages, excluding Latvian since `seamless-m4t-v2-large` and `seamless-m4t-medium` do not support it.
- **Note 2:** Performance differences may be partly attributed to Portuguese variant differences - our training data uses European Portuguese while most benchmarks use Brazilian Portuguese.

---

### Deployment Geography:

Global

### Use Case:

This model serves developers, researchers, academics, and industries building applications that require speech-to-text capabilities, including but not limited to: conversational AI, voice assistants, transcription services, subtitle generation, and voice analytics platforms.

### Release Date:

Huggingface [08/14/2025](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3)

---

## Model Architecture

### Architecture Type:

FastConformer-TDT

### Network Architecture:

- This model was developed based on [FastConformer encoder](#) architecture[3] and [TDT decoder](#)[4]
- This model has 600 million model parameters.

### Input:

- **Input Type(s):** 16kHz Audio
- **Input Format(s):** `.wav` and `.flac` audio formats
- **Input Parameters:** 1D (audio signal)
- **Other Properties Related to Input:** Monochannel audio

### Output:

- **Output Type(s):** Text
- **Output Format:** String
- **Output Parameters:** 1D (text)
- **Other Properties Related to Output:** Punctuations and Capitalizations included.

Our AI models are designed and/or optimized to run on NVIDIA GPU-accelerated systems. By leveraging NVIDIA's hardware (e.g. GPU cores) and software frameworks (e.g., CUDA libraries), the model achieves faster training and inference times compared to CPU-only solutions.

For more information, refer to the [NeMo documentation](https://docs.nvidia.com/nemo-framework/).

---

## How to Use this Model:

There are several ways to use this model. Choose the one that fits your needs.

### Run locally with NeMo-Speech.cpp

[NeMo-Speech.cpp](https://github.com/NVIDIA/NeMo-Speech.cpp) provides a lightweight native C++ runtime for local inference with this model. After [installing the runtime](https://github.com/NVIDIA/NeMo-Speech.cpp#installation):

```bash
hf download nvidia/parakeet-tdt-0.6b-v3 \
  parakeet-tdt-0.6b-v3.q8_0.gguf \
  --local-dir models

nemo-speech transcribe audio.wav \
  --model models/parakeet-tdt-0.6b-v3.q8_0.gguf
```

See the [NeMo-Speech.cpp documentation](https://github.com/NVIDIA/NeMo-Speech.cpp) for more details.

---

### NVIDIA NeMo

To train, fine-tune, or run Python inference with this model, install [NVIDIA NeMo](https://github.com/NVIDIA/NeMo) after installing a recent PyTorch version.

```bash
pip install -U nemo_toolkit['asr']
```

The model is available for use in the NeMo toolkit [5], and can be used as a pre-trained checkpoint for inference or for fine-tuning on another dataset.

You can also run Parakeet TDT with [Transformers](https://github.com/huggingface/transformers) 🤗 (more below).

#### Automatically instantiate the model

```python
import nemo.collections.asr as nemo_asr

asr_model = nemo_asr.models.ASRModel.from_pretrained(model_name="nvidia/parakeet-tdt-0.6b-v3")
```

#### Transcribing using Python

First, let's get a sample:

```bash
wget https://dldata-public.s3.us-east-2.amazonaws.com/2086-149220-0033.wav
```

Then simply do:

```python
output = asr_model.transcribe(['2086-149220-0033.wav'])
print(output[0].text)
```

#### Transcribing with timestamps

To transcribe with timestamps:

```python
output = asr_model.transcribe(['2086-149220-0033.wav'], timestamps=True)
# by default, timestamps are enabled for char, word and segment levels
word_timestamps = output[0].timestamp['word'] # word level timestamps
segment_timestamps = output[0].timestamp['segment'] # segment level timestamps
char_timestamps = output[0].timestamp['char'] # char level timestamps

for stamp in segment_timestamps:
    print(f"{stamp['start']}s - {stamp['end']}s : {stamp['segment']}")
```

#### Transcribing long-form audio

```python
# updating self-attention model of fast-conformer encoder
# setting attention left and right context sizes to 256
asr_model.change_attention_model(self_attention_model="rel_pos_local_attn", att_context_size=[256, 256])

output = asr_model.transcribe(['2086-149220-0033.wav'])
print(output[0].text)
```

#### Streaming with Parakeet models

To use parakeet models in streaming mode use this [script](https://github.com/NVIDIA/NeMo/blob/main/examples/asr/asr_chunked_inference/rnnt/speech_to_text_streaming_infer_rnnt.py) as shown below:

```bash
python NeMo/main/examples/asr/asr_chunked_inference/rnnt/speech_to_text_streaming_infer_rnnt.py \
    pretrained_name="nvidia/parakeet-tdt-0.6b-v3" \
    model_path=null \
    audio_dir="<optional path to folder of audio files>" \
    dataset_manifest="<optional path to manifest>" \
    output_filename="<optional output filename>" \
    right_context_secs=2.0 \
    chunk_secs=2 \
    left_context_secs=10.0 \
    batch_size=32 \
    clean_groundtruth_text=False
```

NVIDIA NIM for v2 parakeet model is available at [https://build.nvidia.com/nvidia/parakeet-tdt-0_6b-v2](https://build.nvidia.com/nvidia/parakeet-tdt-0_6b-v2).

---

### Transformers

Until Parakeet TDT is part of an official Transformers release, you can use it by installing from source:

```bash
pip install git+https://github.com/huggingface/transformers
```

#### Pipeline usage

```python
from transformers import pipeline

pipe = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-0.6b-v3")
out = pipe("https://huggingface.co/datasets/hf-internal-testing/dummy-audio-samples/resolve/main/bcn_weather.mp3")
print(out)
```

#### AutoModel

```python
from transformers import AutoModelForTDT, AutoProcessor
from datasets import load_dataset, Audio
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
num_samples = 3

model_id = "nvidia/parakeet-tdt-0.6b-v3"
processor = AutoProcessor.from_pretrained(model_id)
model = AutoModelForTDT.from_pretrained(model_id, dtype="auto", device_map=device)

ds = load_dataset("hf-internal-testing/librispeech_asr_dummy", "clean", split="validation")
ds = ds.cast_column("audio", Audio(sampling_rate=processor.feature_extractor.sampling_rate))
speech_samples = [el["array"] for el in ds["audio"][:num_samples]]

inputs = processor(speech_samples, sampling_rate=processor.feature_extractor.sampling_rate)
inputs.to(model.device, dtype=model.dtype)
output = model.generate(**inputs, return_dict_in_generate=True)
print(processor.decode(output.sequences, skip_special_tokens=True))
```

#### Timestamping

```python
from datasets import Audio, load_dataset
from transformers import AutoModelForTDT, AutoProcessor
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
num_samples = 3

model_id = "nvidia/parakeet-tdt-0.6b-v3"
processor = AutoProcessor.from_pretrained(model_id)
model = AutoModelForTDT.from_pretrained(model_id, dtype="auto", device_map=device)

ds = load_dataset("hf-internal-testing/librispeech_asr_dummy", "clean", split="validation")
ds = ds.cast_column("audio", Audio(sampling_rate=processor.feature_extractor.sampling_rate))
speech_samples = [el["array"] for el in ds["audio"][:num_samples]]

inputs = processor(speech_samples, sampling_rate=processor.feature_extractor.sampling_rate)
inputs.to(model.device, dtype=model.dtype)
output = model.generate(**inputs, return_dict_in_generate=True)
decoded_output, decoded_timestamps = processor.decode(
    output.sequences,
    durations=output.durations,
    skip_special_tokens=True,
)
print("Transcription:", decoded_output)
print("Timestamped tokens:", decoded_timestamps)
```

#### Training

```python
from transformers import AutoModelForTDT, AutoProcessor
from datasets import load_dataset, Audio
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"

model_id = "nvidia/parakeet-tdt-0.6b-v3"
NUM_SAMPLES = 4

processor = AutoProcessor.from_pretrained(model_id)
model = AutoModelForTDT.from_pretrained(model_id, dtype=torch.bfloat16, device_map=device)
model.train()

ds = load_dataset("hf-internal-testing/librispeech_asr_dummy", "clean", split="validation")
ds = ds.cast_column("audio", Audio(sampling_rate=processor.feature_extractor.sampling_rate))
speech_samples = [el["array"] for el in ds["audio"][:NUM_SAMPLES]]
text_samples = ds["text"][:NUM_SAMPLES]

# passing `text` to the processor will prepare inputs' `labels` key
inputs = processor(audio=speech_samples, text=text_samples, sampling_rate=processor.feature_extractor.sampling_rate)
inputs.to(device=model.device, dtype=model.dtype)

outputs = model(**inputs)
print("Loss:", outputs.loss.item())
outputs.loss.backward()
```

For more details about usage, please refer to the [Transformers' documentation](https://huggingface.co/docs/transformers).

---

## Software Integration:

### Runtime Engine(s):

- NeMo 2.4

### Supported Hardware Microarchitecture Compatibility:

- NVIDIA Ampere
- NVIDIA Blackwell
- NVIDIA Hopper
- NVIDIA Volta

### [Preferred/Supported] Operating System(s):

- Linux

### Hardware Specific Requirements:

At least 2GB RAM for model to load. The bigger the RAM, the larger audio input it supports.

---

## Model Version

**Current version:** `parakeet-tdt-0.6b-v3`. Previous versions can be [accessed](#) here.

---

## Training and Evaluation Datasets:

### Training

This model was trained using the NeMo toolkit [5], following the strategies below:

- Initialized from a CTC multilingual checkpoint pretrained on the Granary dataset [1] [2].
- Trained for 150,000 steps on 128 A100 GPUs.
- Dataset corpora and languages were balanced using a temperature sampling value of 0.5.
- Stage 2 fine-tuning was performed for 5,000 steps on 4 A100 GPUs using approximately 7,500 hours of high-quality, human-transcribed data of NeMo ASR Set 3.0.

Training was conducted using this [example script](#) and [TDT configuration](#).

During the training, a unified SentencePiece Tokenizer [6] with a vocabulary of **8,192 tokens** was used. The unified tokenizer was constructed from the training set transcripts using this [script](#) and was optimized across all 25 supported languages.

### Training Dataset

The model was trained on the combination of [Granary dataset's ASR subset](#) and in-house dataset NeMo ASR Set 3.0:

- **10,000 hours** from human-transcribed NeMo ASR Set 3.0, including:
  - LibriSpeech (960 hours)
  - Fisher Corpus
  - National Speech Corpus Part 1
  - VCTK
  - Europarl-ASR
  - Multilingual LibriSpeech
  - Mozilla Common Voice (v7.0)
  - AMI

- **660,000 hours** of pseudo-labeled data from Granary [1] [2], including:
  - YTC [7]
  - MOSEL [8]
  - YODAS [9]

All transcriptions preserve punctuation and capitalization. The Granary dataset will be made publicly available after presentation at Interspeech 2025.

#### Data Collection Method by dataset:
- Hybrid: Automated, Human

#### Labeling Method by dataset:
- Hybrid: Synthetic, Human

#### Properties:
- Noise robust data from various sources
- Single channel, 16kHz sampled data

---

### Evaluation Datasets

For multilingual ASR performance evaluation:
- Fleurs [10]
- MLS [11]
- CoVoST [12]

For English ASR performance evaluation:
- Hugging Face Open ASR Leaderboard [13] datasets

#### Data Collection Method by dataset:
- Human

#### Labeling Method by dataset:
- Human

#### Properties:
- All are commonly used for benchmarking English ASR systems.
- Audio data is typically processed into a 16kHz mono channel format for ASR evaluation, consistent with benchmarks like the [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard).

---

## Performance

### Multilingual ASR

The tables below summarizes the WER (%) using a Transducer decoder with greedy decoding (without an external language model):

| Language | Fleurs | MLS | CoVoST |
| :--- | :--- | :--- | :--- |
| **Average WER ↓** | **11.97%** | **7.83%** | **11.98%** |
| **bg** | 12.64% | - | - |
| **cs** | 11.01% | - | - |
| **da** | 18.41% | - | - |
| **de** | 5.04% | - | 4.84% |
| **el** | 20.70% | - | - |
| **en** | 4.85% | - | 6.80% |
| **es** | 3.45% | 4.39% | 3.41% |
| **et** | 17.73% | - | 22.04% |
| **fi** | 13.21% | - | - |
| **fr** | 5.15% | 4.97% | 6.05% |
| **hr** | 12.46% | - | - |
| **hu** | 15.72% | - | - |
| **it** | 3.00% | 10.08% | 3.69% |
| **lt** | 20.35% | - | - |
| **lv** | 22.84% | - | 38.36% |
| **mt** | 20.46% | - | - |
| **nl** | 7.48% | 12.78% | 6.50% |
| **pl** | 7.31% | 7.28% | - |
| **pt** | 4.76% | 7.50% | 3.96% |
| **ro** | 12.44% | - | - |
| **ru** | 5.51% | - | 3.00% |
| **sk** | 8.82% | - | - |
| **sl** | 24.03% | - | 31.80% |
| **sv** | 15.08% | - | 20.16% |
| **uk** | 6.79% | - | 5.10% |

> **Note:** WERs are calculated after removing Punctuation and Capitalization from reference and predicted text.

---

### Huggingface Open-ASR-Leaderboard

| Model | Avg WER | AMI | Earnings-22 | GigaSpeech | LS test-clean | LS test-other | SPGI Speech | TEDLIUM-v3 | VoxPopuli |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `parakeet-tdt-0.6b-v3` | 6.34% | 11.31% | 11.42% | 9.59% | 1.93% | 3.59% | 3.97% | 2.75% | 6.14% |

Additional evaluation details are available on the [Hugging Face ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard).[13]

---

### Noise Robustness

Performance across different Signal-to-Noise Ratios (SNR) using MUSAN music and noise samples [14]:

| SNR Level | Avg WER | AMI | Earnings | GigaSpeech | LS test-clean | LS test-other | SPGI | Tedlium | VoxPopuli | Relative Change |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Clean** | 6.34% | 11.31% | 11.42% | 9.59% | 1.93% | 3.59% | 3.97% | 2.75% | 6.14% | - |
| **SNR 10** | 7.12% | 13.99% | 11.79% | 9.96% | 2.15% | 4.55% | 4.45% | 3.05% | 6.99% | -12.28% |
| **SNR 5** | 8.23% | 17.59% | 13.01% | 10.69% | 2.62% | 6.05% | 5.23% | 3.33% | 7.31% | -29.81% |
| **SNR 0** | 11.66% | 24.44% | 17.34% | 13.60% | 4.82% | 10.38% | 8.41% | 5.39% | 8.91% | -83.97% |
| **SNR -5** | 19.88% | 34.91% | 26.92% | 21.41% | 12.21% | 19.98% | 16.96% | 11.36% | 15.30% | -213.64% |

---

## Inference

### Engine:

- NVIDIA NeMo

### Test Hardware:

- NVIDIA A10
- NVIDIA A100
- NVIDIA A30
- NVIDIA H100
- NVIDIA L4
- NVIDIA L40
- NVIDIA Turing T4
- NVIDIA Volta V100

---

## Ethical Considerations:

NVIDIA believes Trustworthy AI is a shared responsibility and we have established policies and practices to enable development for a wide array of AI applications. When downloaded or used in accordance with our terms of service, developers should work with their supporting model team to ensure this model meets requirements for the relevant industry and use case and addresses unforeseen product misuse.

For more detailed information on ethical considerations for this model, please see the Model Card++ Explainability, Bias, Safety & Security, and Privacy Subcards [here](#).

Please report security vulnerabilities or NVIDIA AI Concerns [here](https://www.nvidia.com/en-us/security/).

### Bias:

| Field | Response |
| :--- | :--- |
| Participation considerations from adversely impacted groups protected classes in model design and testing | None |
| Measures taken to mitigate against unwanted bias | None |

### Explainability:

| Field | Response |
| :--- | :--- |
| Intended Domain | Speech to Text Transcription |
| Model Type | FastConformer |
| Intended Users | This model is intended for developers, researchers, academics, and industries building conversational based applications. |
| Output | Text |
| Describe how the model works | Speech input is encoded into embeddings and passed into conformer-based model and output a text response. |
| Name the adversely impacted groups this has been tested to deliver comparable outcomes regardless of | Not Applicable |
| Technical Limitations & Mitigation | Transcripts may be not 100% accurate. Accuracy varies based on language and characteristics of input audio (Domain, Use Case, Accent, Noise, Speech Type, Context of speech, etc.) |
| Verified to have met prescribed NVIDIA quality standards | Yes |
| Performance Metrics | Word Error Rate |
| Potential Known Risks | If a word is not trained in the language model and not presented in vocabulary, the word is not likely to be recognized. Not recommended for word-for-word/incomplete sentences as accuracy varies based on the context of input text |
| Licensing | GOVERNING TERMS: Use of this model is governed by the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) license. |

### Privacy:

| Field | Response |
| :--- | :--- |
| Generatable or reverse engineerable personal data? | None |
| Personal data used to create this model? | None |
| Is there provenance for all datasets used in training? | Yes |
| Does data labeling (annotation, metadata) comply with privacy laws? | Yes |
| Is data compliant with data subject requests for data correction or removal, if such a request was made? | No, not possible with externally-sourced data. |
| Applicable Privacy Policy | [https://www.nvidia.com/en-us/about-nvidia/privacy-policy/](https://www.nvidia.com/en-us/about-nvidia/privacy-policy/) |

### Safety:

| Field | Response |
| :--- | :--- |
| Model Application(s) | Speech to Text Transcription |
| Describe the life critical impact | None |
| Use Case Restrictions | Abide by [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) License |
| Model and dataset restrictions | The Principle of least privilege (PoLP) is applied limiting access for dataset generation and model development. Restrictions enforce dataset access during training, and dataset license constraints adhered to. |











