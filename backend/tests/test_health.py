def test_health_endpoint_returns_service_status(client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "porulaxiom-engine"
