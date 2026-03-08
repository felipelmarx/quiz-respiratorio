from cerebrum.llm.apis import llm_chat

class IBreathworkAgent:
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.system_prompt = """Você é o iBreathwork Agent, um assistente especializado em saúde respiratória.

Você ajuda pessoas a:
1. Avaliar padrões respiratórios
2. Sugerir exercícios de respiração personalizados
3. Fornecer informações sobre saúde pulmonar
4. Orientar práticas de breathwork (trabalho respiratório)

Responda sempre em português brasileiro de forma clara e acolhedora.
Sempre termine com uma dica prática de respiração que a pessoa pode fazer agora."""

    def run(self, task: str):
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": task}
        ]

        response = llm_chat(
            agent_name=self.agent_name,
            messages=messages,
        )

        return response
