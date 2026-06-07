from app.services.llm_client import LLMClient


def test_grammar_corrections_detect_errors():
    client = LLMClient()
    text = "I am work in a big company for five year."
    corrections = client._demo_grammar_corrections(text)
    originals = {c["original"].lower() for c in corrections}
    assert "i am work" in originals
    assert any("year" in c["original"].lower() for c in corrections)


def test_grammar_corrections_clean_sentence():
    client = LLMClient()
    corrections = client._demo_grammar_corrections(
        "I have five years of experience in software development."
    )
    assert corrections == []
