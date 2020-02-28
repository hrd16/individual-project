package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"
	"time"
)

func main() {
	replicas, _ := strconv.Atoi(os.Args[1])
	namespace := os.Args[2]

	fmt.Printf("Replicas: %d\n", replicas)
	fmt.Printf("Namespace: %s\n", namespace)

	lookup := make(map[string]string)

	for i := 0; i < replicas; i++ {
		addr := fmt.Sprintf("app-%d.app-service.%s.svc.cluster.local", i, namespace)
		ips, err := net.LookupIP(addr)
		if err != nil {
			fmt.Printf("Could not get IPs: %v\n", err)
			i = 0
			time.Sleep(time.Millisecond * 100)
		} else {
			lookup[ips[0].String()] = addr
		}
	}

	fmt.Println(lookup)

	origin, _ := url.Parse("http://127.0.0.1:10002")

	director := func(req *http.Request) {
		req.Header.Add("X-Forwarded-Host", req.Host)
		req.Header.Add("X-Origin-Host", origin.Host)
		req.URL.Scheme = "http"
		req.URL.Host = origin.Host
	}

	proxy := &httputil.ReverseProxy{Director: director}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			log.Printf("Error reading body: %v", err)
			http.Error(w, "can't read body", http.StatusBadRequest)
			return
		}

		r.Body = ioutil.NopCloser(bytes.NewBuffer(body))

		xfwd := r.Header.Get("X-Forwarded-For")
		log.Printf("%s - %s - %s\n", r.URL.Path, xfwd, lookup[xfwd])

		time.Sleep(500 * time.Millisecond)

		proxy.ServeHTTP(w, r)
	})

	log.Fatal(http.ListenAndServe(":10001", nil))
}
