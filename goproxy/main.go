package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"time"
)

type LogMessage struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Path    string `json:"path"`
	Dropped bool   `json:"dropped"`
	Latency int    `json:"latency"`
}

func main() {
	log.SetFlags(0)

	replicas, _ := strconv.Atoi(os.Args[1])
	namespace := os.Args[2]
	latency, _ := strconv.Atoi(os.Args[3])
	dropRate, _ := strconv.ParseFloat(os.Args[4], 64)
	clientReplicas, _ := strconv.Atoi(os.Args[5])

	log.Printf("Replicas: %d\n", replicas)
	log.Printf("Namespace: %s\n", namespace)
	log.Printf("Latency: %d\n", latency)
	log.Printf("Drop rate: %f\n", dropRate)
	log.Printf("Client replicas: %d\n", clientReplicas)

	lookup := make(map[string]string)

	for i := 0; i < replicas; {
		addr := fmt.Sprintf("app-%d.app-service.%s.svc.cluster.local", i, namespace)
		ips, err := net.LookupIP(addr)
		if err != nil {
			log.Printf("Could not get IPs: %v\n", err)
			time.Sleep(time.Millisecond * 100)
		} else {
			lookup[ips[0].String()] = addr
			i++
		}
	}

	for i := 0; i < clientReplicas; {
		addr := fmt.Sprintf("client-%d.client-service.%s.svc.cluster.local", i, namespace)
		ips, err := net.LookupIP(addr)
		if err != nil {
			log.Printf("Could not get IPs: %v\n", err)
			time.Sleep(time.Millisecond * 100)
		} else {
			lookup[ips[0].String()] = addr
			i++
		}
	}

	log.Println(lookup)

	origin, _ := url.Parse("http://127.0.0.1:10002")

	director := func(req *http.Request) {
		req.Header.Add("X-Forwarded-Host", req.Host)
		req.Header.Add("X-Origin-Host", origin.Host)
		req.URL.Scheme = "http"
		req.URL.Host = origin.Host
	}

	proxy := &httputil.ReverseProxy{Director: director}

	rgx, _ := regexp.Compile("^([^.]+)")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			log.Printf("Error reading body: %v", err)
			http.Error(w, "can't read body", http.StatusBadRequest)
			return
		}

		r.Body = ioutil.NopCloser(bytes.NewBuffer(body))

		xfwd := r.Header.Get("X-Forwarded-For")
		shouldDrop := rand.Float64() < dropRate

		logMessage := LogMessage{
			From:    rgx.FindString(lookup[xfwd]),
			To:      rgx.FindString(r.Host),
			Path:    r.URL.Path,
			Dropped: shouldDrop,
			Latency: latency,
		}

		b, _ := json.Marshal(logMessage)
		logStr := string(b)
		log.Printf("%s\n", logStr)

		time.Sleep(time.Duration(latency) * time.Millisecond)

		if shouldDrop {
			return
		}

		proxy.ServeHTTP(w, r)
	})

	log.Fatal(http.ListenAndServe(":10001", nil))
}
